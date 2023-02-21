import deepClone from "deep-clone";
import Faust2WebAudio, { Faust, FaustAudioWorkletNode } from "faust2webaudio";
import { TCompiledDsp } from "faust2webaudio/src/types";
import { getHex, getPastelColor } from "pastel-color";
import { batch, createEffect, createMemo, createRoot, untrack } from "solid-js";
import { createStore, produce, StoreSetter } from "solid-js/store";
import zeptoid from "zeptoid";

import {
  DEFAULT_FX,
  EXTRA_FXS,
  FXS,
  INSTRUMENT_AMOUNT,
  ROOT_FREQUENCY,
  SEQUENCE_LENGTH,
  TRACK_AMOUNT,
} from "./constants";
import {
  defaultPattern,
  defaultSampler,
  defaultSequences,
  defaultSynth,
} from "./defaults";

import getParametersFromDsp from "./libs/faust/collectParameters";
import arrayBufferToWaveform from "./libs/waveform/arrayBufferToWaveform";
import audioBufferToWaveform from "./libs/waveform/audioBufferToWaveform";

import ARRAY from "./utils/ARRAY";
import bpmToMs from "./utils/bpmToMs";
import copyArrayBuffer from "./utils/copyArrayBuffer";
import download from "./utils/download";
import fileToArrayBuffer from "./utils/fileToArrayBuffer";
import ftom from "./utils/ftom";
import getLocalPosition from "./utils/getLocalPosition";
import Initialized from "./utils/Initialized";
import moveInArray from "./utils/moveInArray";

import AudioNodeRecorder from "./utils/webaudio/AudioNodeRecorder";
import cloneAudioBuffer from "./utils/webaudio/cloneAudioBuffer";
import { getWebAudioMediaStream } from "./utils/webaudio/getWebAudioMediaStream";
import StreamRecorder from "./utils/webaudio/StreamRecorder";

import { EditorModalProps } from "./components/EditorModal";
import { ContextMenuProps } from "./components/ContextMenu";

import {
  Choice,
  Composition,
  CompositionBlockProps,
  CompositionElementProps,
  CompositionGroupProps,
  DSPElement,
  FaustElement,
  FaustFactory,
  FaustParameter,
  Instrument,
  Pattern,
  Sampler,
  Synth,
  Track,
  Waveform,
  WebAudioElement,
} from "./types";

interface DraggingFx {
  id: string;
  name: string;
  detachable: boolean;
  parameters?: any[];
  active: boolean;
}

interface CompositionFx {
  id: string;
  patternId: string;
  type: "composition" | "pattern";
}

const [store, setStore] = createStore<{
  faust?: Faust;
  context?: AudioContext;
  clock: number;
  clockOffset: number;
  compositionClock: number;
  relativeClock: number;
  playingElementPattern?: {
    element: CompositionElementProps;
    pattern: Pattern;
  };
  loopingBlock?: CompositionBlockProps;
  bpm: number;
  playMode: "pattern" | "composition";
  rootNode?: AudioNode;
  audioRecorder?: {
    recorder: AudioNodeRecorder;
    type: "mic" | "file" | "resample";
  };
  patterns: Pattern[];
  tracks: Track[];
  composition: Composition;
  faustFactories: FaustFactory[];
  instruments: Instrument[];
  editors: EditorModalProps[];
  selection: {
    frequency: number;
    instrumentIndex: number;
    patternId: string;
    trackIndex: number;
    composition: (CompositionElementProps | CompositionGroupProps)[];
  };
  keys: {
    shift: boolean;
    control: boolean;
    alt: boolean;
  };
  dragging: {
    fx: DraggingFx | undefined;
    composition: CompositionBlockProps | undefined;
  };
  bools: {
    playing: boolean;
    mousedown: boolean;
    coding: boolean;
  };
  arrayBuffers: { arrayBuffer: ArrayBuffer; name: string }[];
  mic?: MediaStream;
  solos: number[];
  disposes: any[];
  contextmenu?: ContextMenuProps;
}>({
  compositionClock: 0,
  faust: undefined,
  context: new window.AudioContext(),
  playMode: "pattern",
  clock: 0,
  clockOffset: 0,
  relativeClock: 0,
  bpm: 120,
  rootNode: undefined,
  audioRecorder: undefined,
  patterns: [defaultPattern("first")],
  composition: [],
  tracks: Array(TRACK_AMOUNT)
    .fill(0)
    .map(() => ({
      instrument: undefined,
      semitones: 0,
      frequency: 0,
      fxChain: [],
      compilingIds: [],
    })),
  instruments: Array(INSTRUMENT_AMOUNT)
    .fill(0)
    .map((_, i) => defaultSampler(i, TRACK_AMOUNT)),
  editors: [],
  selection: {
    frequency: ROOT_FREQUENCY,
    instrumentIndex: 0,
    patternId: "first",
    trackIndex: 0,
    composition: [],
  },
  keys: {
    shift: false,
    control: false,
    alt: false,
  },
  faustFactories: [],
  dragging: {
    fx: undefined,
    composition: undefined,
  },
  bools: {
    playing: true,
    mousedown: false,
    coding: false,
  },
  arrayBuffers: [],
  mic: undefined,
  solos: [],
  // TODO: disposes collects all the createRoot-dispose-functions
  // figure out a better way to structure these into the code
  disposes: [],
  contextmenu: undefined,
});

// INIT

const initContext = () => {
  const context = new window.AudioContext();
  let rootNode = new GainNode(context);

  setStore("context", context);
  setStore("rootNode", rootNode);
};

const initFaust = async () => {
  const faust = new Faust({
    wasmLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.wasm",
    dataLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.data",
  });
  await faust.ready;
  setStore("faust", faust);
};

const initKeyboard = () => {
  window.addEventListener("resize", () => setStore("contextmenu", undefined));
  window.addEventListener("mousedown", () =>
    setStore("bools", "mousedown", true)
  );
  window.addEventListener("mouseup", () =>
    setStore("bools", "mousedown", false)
  );
  window.addEventListener("contextmenu", e => {
    e.preventDefault();
  });

  window.addEventListener("blur", () => {
    setStore("keys", "alt", false);
    setStore("keys", "shift", false);
    setStore("keys", "control", false);
  });

  window.onkeydown = e => {
    if (store.bools.coding) return;
    switch (e.code) {
      case "ShiftLeft":
      case "ShiftRight":
        setStore("keys", "shift", true);
        break;
      case "AltLeft":
      case "AlttRight":
        setStore("keys", "alt", true);
        break;

      case "OSLeft":
      case "OSRight":
      case "ControlLeft":
      case "ControlRight":
        setStore("keys", "control", true);
        break;
      case "Space":
        e.preventDefault();
        togglePlaying();
        break;
      case "KeyR":
        if (store.keys.shift) actions.recordAudio("file");
        if (store.keys.alt) actions.recordAudio("resample");
        break;
    }
  };
  window.onkeyup = e => {
    if (store.bools.coding) return;
    switch (e.code) {
      case "ShiftLeft":
      case "ShiftRight":
        setStore("keys", "shift", false);
        break;
      case "AltLeft":
      case "AltRight":
        setStore("keys", "alt", false);
        break;
      case "OSLeft":
      case "OSRight":
      case "ControlLeft":
      case "ControlRight":
        setStore("keys", "control", false);
        break;
    }
  };
};

const initPlayingCompositionElementPattern = () => {
  const element = findFirstCompositionElement();
  if (!element) return;
  const pattern = getPattern(element?.patternId);
  if (!pattern) return;
  setStore("playingElementPattern", {
    element: { ...element },
    pattern: { ...pattern },
  });
};

const updatePlayingCompositionElementPattern = () => {
  const element = findNextPlayingCompositionElement()!;

  if (!element) {
    return;
  }

  const pattern = getPattern(element.patternId)!;

  setStore("selection", "patternId", pattern.id);

  setStore("playingElementPattern", {
    element: { ...element },
    pattern: { ...pattern },
  });
};

const updateRelativeClock = () => {
  if (store.playMode !== "composition") {
    const pattern = getSelectedPattern();
    if (!pattern) return;
    setStore(
      "relativeClock",
      clock => (clock + 1) % pattern.sequences[0].length
    );
    return;
  }
  if (store.composition.length > 0) {
    if (!store.playingElementPattern) {
      initPlayingCompositionElementPattern();
    }

    const playingElementPattern = store.playingElementPattern;
    if (!playingElementPattern) return;

    let relativeClock = store.relativeClock + 1;

    const playingPatternSize =
      playingElementPattern.pattern.sequences[0].length;

    if (relativeClock >= playingPatternSize) {
      relativeClock = 0;
      updatePlayingCompositionElementPattern();
    }

    setStore("relativeClock", relativeClock);
  }
};

const setRelativeClock = (index: number) => {
  const delta = index - store.relativeClock;
  setStore("relativeClock", c => c + delta);
  setStore("clock", c => c + delta);
  renderAudio();
};

const initClock = function () {
  setStore("clockOffset", performance.now());

  let lastTimestamp: number | undefined;
  let microClock = 0;

  const run = (timestamp: number) => {
    if (!store.bools.playing) {
      lastTimestamp = undefined;
      return;
    }
    requestAnimationFrame(run);
    if (lastTimestamp) {
      const delta = timestamp - lastTimestamp;
      microClock += delta;
      const extraClock = microClock / bpmToMs(store.bpm);

      if (extraClock >= 1) {
        updateRelativeClock();
        setStore("clock", clock => clock + Math.floor(extraClock));
        renderAudio();
        microClock = (extraClock % 1) * bpmToMs(store.bpm);
      }
    }

    lastTimestamp = timestamp;
  };

  createEffect(() => {
    if (store.bools.playing) {
      untrack(() => requestAnimationFrame(run));
    }
  });
};

const initFx = async () => {
  setStore("faustFactories", []);
  const defaultFxs = await Promise.all(FXS.map(code => compileFaust(code)));
  defaultFxs.forEach(result => {
    if (!result.success) return;
    addToFaustFactories(createFactory(result.dsp));
  });
};

const initExtraFx = async () => {
  const defaultFxs = await Promise.all(
    EXTRA_FXS.map(code => compileFaust(code))
  );
  defaultFxs.forEach(result => {
    if (!result.success) return;
    addToFaustFactories(createFactory(result.dsp));
  });
};

const initTracks = async () => {
  store.rootNode!.connect(store.context!.destination);
  const pitchshifterFactory = store.faustFactories.find(
    fx => fx.initialName === "pitchShifter"
  );

  if (!pitchshifterFactory) return;
  store.tracks.forEach(async (track, index) => {
    const pitchshifter = await createNodeAndAddToFxChainTrack(
      {
        factory: pitchshifterFactory,
        id: "pitchshifter",
        trackIndex: index,
        detachable: false,
        active: true,
      },
      0,
      false
    );
    if (!pitchshifter || !store.context) return;
    const [output, input] = createPorts();

    const dispose = createRoot(dispose => {
      setStore("tracks", index, "fxChain", chain => [output, ...chain, input]);
      setStore("tracks", index, "pitchshifter", pitchshifter.node);
      updateFxChain(track.fxChain, store.rootNode);
      createEffect(() => {
        if (store.solos.length > 0 && !store.solos.includes(index)) {
          (track.fxChain[0].node as GainNode).gain.value = 0;
        } else {
          (track.fxChain[0].node as GainNode).gain.value = 1;
        }
      });
      return dispose;
    });

    setStore("disposes", disposes => [...disposes, dispose]);
  });
};

const initInstruments = async () => {
  if (!store.context) return;
  for (let i = 0; i < INSTRUMENT_AMOUNT; i++) {
    batch(() => {
      store.tracks.forEach((_, index) => {
        const [input, output] = createPorts();
        if (!input || !output) return;
        setStore("instruments", i, "fxChains", index, [output, input]);
        updateFxChain(store.instruments[i].fxChains[index]);
      });
    });
  }
};

// CREATE

const createGain = (): WebAudioElement => {
  return {
    id: zeptoid(),
    initialName: "gain",
    detachable: false,
    node: new GainNode(store.context!),
    connection: undefined,
    active: true,
  };
};

const createGains = () => [createGain(), createGain()];

const createPorts = () => {
  const [input, output] = createGains();
  input.initialName = "input";
  output.initialName = "output";
  return [output, input];
};

const createFactory = (dsp: TCompiledDsp, id?: string) => {
  const f = {
    node: Object.setPrototypeOf(dsp, {}),
    initialName: dsp.dspMeta.name,
    parameters: [],
    id: id || zeptoid(),
  };

  const [factory, setFactory] = createStore<FaustFactory>(f);

  createRoot(() => {
    createEffect(() =>
      setFactory("parameters", getParametersFromDsp(factory.node))
    );
  });

  return factory;
};

// GENERAL PARAMETERS

const findFirstCompositionElement = (block: CompositionBlockProps) => {
  const blocks = [block];

  let currentBlock;
  while (blocks.length > 0) {
    currentBlock = blocks.shift();
    if (!currentBlock) continue;
    if ("blocks" in currentBlock) {
      blocks.unshift(...currentBlock.blocks);
      continue;
    }
    return currentBlock;
  }
};

const setPlayMode = (playMode: "pattern" | "composition") => {
  setStore("playMode", playMode);
  if (store.playMode === "composition") {
    if (store.composition.length === 0) return undefined;

    const firstElement = findFirstCompositionElement(store.composition[0]);

    if (!firstElement) return;
    setStore("playingElementPattern", {
      element: { ...firstElement },
      pattern: getPattern(firstElement.patternId),
    });
    setStore(
      "relativeClock",
      store.clock % store.playingElementPattern!.pattern.sequences[0].length
    );
  }
};
const setBPM = (bpm: StoreSetter<number, ["bpm"]>, offset: number) => {
  batch(() => {
    setStore("bpm", bpm);
    const clockOffset = store.clock * bpmToMs(store.bpm);
    setStore("clockOffset", performance.now() - clockOffset);
  });
};

const setSelectedFrequency = (frequency: number) =>
  setStore("selection", "frequency", frequency);

// FAUST

const compileFaust = async (
  code: string
): Promise<
  { success: true; dsp: TCompiledDsp } | { success: false; error: string }
> => {
  try {
    const dsp = await store.faust?.compileCodes(
      code,
      ["-I", "libraries/"],
      true
    );
    if (!dsp) return { success: false, error: "idks" };
    return { success: true, dsp };
  } catch (error: any) {
    console.error("code can not compile: ", code, error);
    return { success: false, error: error.toString() };
  }
};

const addToFaustFactories = (fx: FaustFactory) =>
  setStore("faustFactories", faustFactories => [...faustFactories, fx]);

const updateFaustFactory = (id: string, dsp: TCompiledDsp) => {
  setStore(
    "faustFactories",
    factory => factory.id === id,
    "node",
    Object.setPrototypeOf(dsp, {})
  );
};

const createFaustNode = async (
  dsp: TCompiledDsp
): Promise<Faust2WebAudio.FaustAudioWorkletNode | undefined> => {
  if (!store.faust || !store.context) return undefined;
  const optionsIn = {
    compiledDsp: dsp,
    audioCtx: store.context,
    args: { "-I": "libraries/" },
  };

  // TODO: this is some hacky way to not get errors when i create multiple nodes from the same factory
  // probably best to look into faust2webaudio and improve the code
  dsp.shaKey += zeptoid();

  const node = await store.faust.getAudioWorkletNode(optionsIn);
  return node;
};

const addFx = async () => {
  const id = zeptoid();

  addToEditors({
    id,
    code: () => DEFAULT_FX,
    compile: async (code: string) => {
      const response = await compileFaust(code);
      if (response.success) {
        if (store.faustFactories.find(factory => factory.id === id)) {
          updateFaustFactory(id, response.dsp);
        } else {
          addToFaustFactories(createFactory(response.dsp, id));
        }
      }
      return response;
    },
  });
};

// INSTRUMENT

const setInstrument = (
  i: number,
  instrument: StoreSetter<Instrument, [number, "instruments"]>
) => setStore("instruments", i, instrument);

const addInstrument = () => {
  const sampler = defaultSampler(store.instruments.length, store.tracks.length);

  // sampler.fxChains = createPorts();

  sampler.fxChains = store.tracks.map(createPorts);

  setStore("instruments", instruments => [...instruments, sampler]);
  setSelectedInstrumentIndex(store.instruments.length - 1);
};

const getColorInstrument = (instrumentIndex: number) => {
  const instrument = store.instruments[instrumentIndex];
  if (instrument.active) {
    return instrument.color;
  }
  return "";
};

const setSelectedInstrumentIndex = (index: number) =>
  setStore("selection", "instrumentIndex", index);

const getSelectedInstrument = () =>
  store.instruments[store.selection.instrumentIndex];

const setTypeSelectedInstrument = (type: "sampler" | "synth") => {
  const instrument = getSelectedInstrument();
  if (!instrument.active) return;
  if (type === "sampler") {
    const sampler = defaultSampler(instrument.index, store.tracks.length);
    sampler.fxChains = instrument.fxChains;
    setSelectedInstrument(sampler);
  } else {
    const synth = defaultSynth(instrument.index);
    synth.fxChains = instrument.fxChains;
    setSelectedInstrument(synth);
  }
};

const toggleTypeSelectedInstrument = () => {
  const instrument = getSelectedInstrument();
  if (!instrument.active) return;
  if (instrument.type === "synth") {
    const sampler = defaultSampler(instrument.index, store.tracks.length);
    setSelectedInstrument(sampler);
  } else {
    const synth = defaultSynth(instrument.index);
    setSelectedInstrument(synth);
  }
  // setStore("instruments", store.selection.instrumentIndex, "type", type => type === "synth" ? "sampler" : "synth")
};

const setSelectedInstrument = function (...args: any[]) {
  setStore("instruments", store.selection.instrumentIndex, ...args);
};

const getUnusedInstrument = (index?: number) =>
  store.instruments
    // .filter((v) => v.index !== index)
    .find((instrument, i) => {
      if (i === index) return;
      return (
        (instrument.type === "sampler" && !instrument.audioBuffer) ||
        (instrument.type === "synth" && instrument.elements.length === 0)
      );
    });

const cloneSelectedInstrument = async () => {
  const { audioBuffer, waveform, fxChains, selection, index } =
    getSelectedInstrument() as Sampler;
  const sampler = defaultSampler(store.instruments.length, store.tracks.length);

  const newChains = await cloneFxChains(fxChains);

  const unusedInstrument = getUnusedInstrument(index);

  if (unusedInstrument) {
    sampler.index = unusedInstrument.index;
    setStore("instruments", unusedInstrument.index, sampler);
    setSelectedInstrumentIndex(unusedInstrument.index);
  } else {
    setStore("instruments", instruments => [...instruments, sampler]);
    setSelectedInstrumentIndex(store.instruments.length - 1);
  }

  setSelectedInstrument("selection", newChains);
  setSelectedInstrument("color", getHex());

  setSelectedInstrument("fxChains", newChains);
  getSelectedInstrument().fxChains.forEach((fxChain: DSPElement[]) => {
    updateFxChain(fxChain);
  });

  if (audioBuffer && waveform) {
    setSamplerAudioBuffer(cloneAudioBuffer(audioBuffer, store.context!));
    setSamplerWaveform(deepClone(waveform));
    setSamplerSelection("start", selection.start);
    setSamplerSelection("end", selection.end);
  }
};

// INSTRUMENT: SAMPLER

const setSamplerNavigation = (
  type: "start" | "end",
  value: ((x: number) => number) | number
) => setSelectedInstrument("navigation", type, value);

const setSamplerSelection = (
  type: "start" | "end",
  value: ((x: number) => number) | number
) => setSelectedInstrument("selection", type, value);

const setSamplerWaveform = (waveform: Waveform) =>
  setSelectedInstrument("waveform", waveform);

const setSamplerAudioBuffer = (audioBuffer: AudioBuffer) =>
  setSelectedInstrument("audioBuffer", audioBuffer);

const setSamplerArrayBufferName = (name: string) =>
  setSelectedInstrument("arrayBufferName", name);

const getAudioBufferAndWaveformFromArrayBuffer = async (
  arrayBuffer: ArrayBuffer
) => {
  const waveform = await arrayBufferToWaveform(
    copyArrayBuffer(arrayBuffer),
    store.context!
  );
  const audioBuffer = await store.context!.decodeAudioData(
    copyArrayBuffer(arrayBuffer)
  );
  return { waveform, audioBuffer };
};

const setSamplerFromArrayBuffer = async ({
  arrayBuffer,
  name,
}: {
  arrayBuffer: ArrayBuffer;
  name: string;
}) => {
  const { waveform, audioBuffer } =
    await getAudioBufferAndWaveformFromArrayBuffer(arrayBuffer);
  setSamplerArrayBufferName(name);
  setSamplerWaveform(waveform);
  setSamplerAudioBuffer(audioBuffer);
  setSamplerSelection("start", 0);
  setSamplerSelection("end", waveform.length);
};

const setSamplerSpeed = (speed: StoreSetter<number, ["speed"]>) => {
  batch(() => {
    setSelectedInstrument("speed", speed);
    const sampler = getSelectedInstrument() as Sampler;
    if (
      (sampler.speed < 0 && !sampler.inverted) ||
      (sampler.speed > 0 && sampler.inverted)
    ) {
      revertSamplerAudiobuffer();
      setSelectedInstrument("inverted", (inverted: boolean) => !inverted);
    }
    store.tracks.forEach((track, index) => {
      if (track.instrument === sampler) {
        const speed = sampler.speed;
        if (track.playingInstrument) {
          track.playingInstrument.playbackRate.value = speed;

          const semitones = getTrackSemitones(track.frequency, Math.abs(speed));
          const shift = getTrackShift(index);
          const totalPitch = semitones + shift!.value;

          track.pitchshifter?.setParamValue("/Pitch_Shifter/shift", totalPitch);
        }
      }
    });
  });
};

const revertSamplerAudiobuffer = async () => {
  const { audioBuffer, waveform, selection, navigation } =
    getSelectedInstrument() as Sampler;

  if (!store.context || !audioBuffer || !waveform) return;

  const clonedBuffer = cloneAudioBuffer(audioBuffer, store.context);

  for (let i = 0; i < clonedBuffer.numberOfChannels; i++) {
    Array.prototype.reverse.call(clonedBuffer.getChannelData(i));
  }

  setSelectedInstrument("audioBuffer", clonedBuffer);

  const clonedBuffer2 = cloneAudioBuffer(clonedBuffer, store.context);
  const reversedWaveform = await audioBufferToWaveform(
    clonedBuffer2,
    store.context
  );
  actions.setSamplerWaveform(reversedWaveform);

  var { start, end } = selection;
  setSamplerSelection("start", waveform.length - end);
  setSamplerSelection("end", waveform.length - start);

  var { start, end } = navigation;
  setSamplerNavigation("start", end);
  setSamplerNavigation("end", start);
};

const addToArrayBuffers = (data: { name: string; arrayBuffer: ArrayBuffer }) =>
  setStore("arrayBuffers", arrayBuffers => [...arrayBuffers, data]);

const uploadAudioFile = async (file: File) => {
  if (!store.context) return;
  const arrayBuffer = await fileToArrayBuffer(file);
  actions.addToArrayBuffers({
    arrayBuffer: copyArrayBuffer(arrayBuffer),
    name: file.name,
    file,
  });
  await setSamplerFromArrayBuffer({ arrayBuffer, name: file.name });
};

// SYNTHS

const setSynthCode = (code: string) => setSelectedInstrument("code", code);

// PATTERNS

const incrementSelectedPatternId = (e: MouseEvent) => {
  const offset = getLocalPosition(e).percentage.y > 50 ? 1 : -1;
  const index = getPatternIndex(store.selection.patternId);

  let nextIndex = (index + offset) % store.patterns.length;
  if (nextIndex < 0) nextIndex = store.patterns.length - 1;

  // setStore("selection", "patternId", store.patterns[nextIndex].id)
  setSelectedPatternId(store.patterns[nextIndex].id);
};

const setSelectedPatternId = (id: string) => {
  if (id === store.selection.patternId) return;
  const pattern = getPattern(id);
  if (!pattern) return;
  console.time("pattern changing");
  setStore("selection", "patternId", id);
  // document.documentElement.style.setProperty('--selected-pattern', pattern.color)
  console.timeEnd("pattern changing");
};

const getSelectedPattern = () => getPattern(store.selection.patternId);

const getSelectedPatternIndex = () =>
  getPatternIndex(store.selection.patternId);

const clearSelectedPattern = () =>
  setStore(
    "patterns",
    getSelectedPatternIndex(),
    "sequences",
    defaultSequences()
  );

const createPattern = () => {
  const id = zeptoid();
  setStore("patterns", patterns => [...patterns, defaultPattern(id)]);
  setStore("selection", "patternId", id);
};
const duplicatePattern = (pattern: Pattern) => {
  const duplicate = JSON.parse(JSON.stringify(pattern));
  duplicate.id = zeptoid();
  duplicate.color = getHex();
  setStore(
    "patterns",
    produce((patterns: Pattern[]) =>
      patterns.splice(getSelectedPatternIndex() + 1, 0, duplicate)
    )
  );
  setSelectedPatternId(duplicate.id);
};

const duplicateSelectedPattern = () => {
  duplicatePattern(store.patterns[getSelectedPatternIndex()]);
};

const createFaustElementFromFaustFactory = async ({
  factory,
  id,
  detachable,
  active,
  parameters,
}: {
  factory: FaustFactory;
  id: string;
  detachable?: boolean;
  active: boolean;
  parameters?: FaustParameter[];
}): Promise<FaustElement | undefined> => {
  const n = await createFaustNode(factory.node);
  if (!n) return;
  // const [node, setNode] = createSignal(n);

  const initialElement = {
    id,
    factoryId: factory.id,
    node: n,
    initialName: n.dspMeta.name,
    parameters: parameters || deepClone(factory.parameters),
    detachable: detachable === undefined ? true : detachable,
    active,
    connection: undefined,
  };

  const [element, setElement] = createStore<FaustElement>(initialElement);

  let init = false;
  createRoot(() => {
    createEffect(async () => {
      // needed to trigger reactivity;
      const dsp = factory.node;

      if (!init) {
        init = true;
        return;
      }
      if (!store.context) return;
      const node = await createFaustNode(dsp);
      if (!node) return;
      setElement("node", node);
      if (element.connection)
        node.connect(element.connection /* || store.context?.destination */);
    });

    const equal = (array1: string[], array2: string[]) => {
      if (array1.length !== array2.length) return false;
      let result = true;
      array1.some(value => {
        if (array2.indexOf(value) === -1) {
          result = false;
          return true;
        }
      });
      return result;
    };

    const equalParameters = (
      parameters1: FaustParameter[],
      parameters2: FaustParameter[]
    ) => {
      const labels1 = parameters1.map(v => v.label);
      const labels2 = parameters2.map(v => v.label);
      return equal(labels1, labels2);
    };

    createEffect(() => {
      const dsp = factory.node;
      const newParameters = getParametersFromDsp(factory.node);
      const existingParameters = untrack(() => element.parameters);

      if (!equalParameters(newParameters, existingParameters)) {
        const mergedParameters = newParameters.map(parameter => {
          const existingParameter = existingParameters.find(
            p => p.label === parameter.label
          );
          return existingParameter || parameter;
        });
        setElement("parameters", mergedParameters);
      }
    });
  });

  // const faustNode = createMemo(() => createFaustNode(factory.dsp));
  return element;
};

const getPattern = (patternId: string) =>
  store.patterns.find(pattern => pattern.id === patternId);
const getPatternIndex = (patternId: string) =>
  store.patterns.findIndex(pattern => pattern.id === patternId);
const getPatternColor = (patternId: string) =>
  getPattern(patternId)?.color || "";

// FXCHAIN

const getActiveElementFromFxChain = (fxChain: DSPElement[], index: number) => {
  while (true) {
    if (fxChain[index].active) {
      return fxChain[index];
    } else {
      index--;
    }
    // TODO: change in case we change fxChain[0] being nothing
    if (index < 0) return fxChain[0];
  }
};

const updateFxChain = (
  fxChain: DSPElement[],
  rootNode?: FaustAudioWorkletNode | AudioNode
) => {
  const [_, setFxChain] = createStore(fxChain);
  const context = store.context;
  if (!context) return;

  fxChain.forEach((fxElement: DSPElement, index: number) => {
    if (index === 0) {
      if (!rootNode) return;
      if (fxElement.connection !== rootNode) {
        if (fxElement.connection)
          fxElement.node.disconnect(fxElement.connection);
        fxElement.node.connect(rootNode);
        setFxChain(0, "connection", rootNode);
      }
      return;
    }

    const node = fxElement.node;
    const prev = getActiveElementFromFxChain(fxChain, index - 1);

    if (fxElement.active) {
      if (fxElement.connection !== prev.node && fxElement.connection) {
        node.disconnect(fxElement.connection);
      }
      node.connect(prev.node);
    } else {
      /*    
      if(fxElement.connection){
        try{
          node.disconnect(fxElement.connection);
        }catch(err){
          console.error("error while disconnecting node: ", err)
        }
      } */
    }
    setFxChain(index, "connection", prev?.node);
  });
};

const getEntryFxTrack = (trackIndex: number) => {
  const fxChain = store.tracks[trackIndex].fxChain;
  // return fxChain[fxChain.length - 1].node
  return getActiveElementFromFxChain(fxChain, fxChain.length - 1);
};

const createNodeAndAddToFxChainInstrument = async ({
  factory,
  id,
  detachable,
  parameters,
  active,
  instrument,
}: {
  factory: FaustFactory;
  id: string;
  detachable?: boolean;
  parameters?: any[];
  active: boolean;
  instrument?: Instrument;
}) => {
  instrument = instrument || getSelectedInstrument();
  const [_, setInstrument] = createStore(instrument);

  if (!instrument) return;

  if (instrument.compilingIds.find(compilingId => compilingId === id)) return;
  setInstrument(
    "compilingIds",
    produce((compilingIds: string[]) => compilingIds.push(id))
  );

  const elements: FaustElement[] = await Promise.all(
    instrument.fxChains.map((_, i) =>
      createFaustElementFromFaustFactory({
        factory,
        id,
        detachable,
        active,
        parameters,
      })
    )
  );

  // batch(() => {

  let error;
  createRoot(() => {
    elements.forEach((fxElement, i) => {
      if (!fxElement) {
        error = true;
        return;
      }
      const [element, setElement] = createStore<FaustElement>(fxElement);

      createEffect(() => {
        const parameters = deepClone(elements[0]?.parameters);
        if (i === 0 || !parameters) return;

        setElement("parameters", parameters);
      });

      let isInitialized = Initialized();
      createEffect(() => {
        if (!isInitialized(elements[0]!.active)) return;
        setElement("active", elements[0]!.active);

        updateFxChain(getSelectedInstrument().fxChains[i]);
      });

      createEffect(() => {
        element.parameters.forEach(({ address, value }) => {
          element.node.setParamValue(address, value);
        });
      });

      setInstrument("fxChains", i, (fxChain: DSPElement[]) =>
        ARRAY.insert(fxChain, fxChain.length - 1, element)
      );
    });
  });
  if (error) return;
  instrument.fxChains.forEach((fxChain, index) =>
    updateFxChain(fxChain, getEntryFxTrack(index).node)
  );

  setInstrument("compilingIds", (compilingIds: string[]) =>
    compilingIds.filter(compilingId => compilingId !== id)
  );
};

const createNodeAndAddToFxChainTrack = async (
  {
    factory,
    id,
    trackIndex,
    detachable,
    parameters,
    active,
  }: {
    factory: FaustFactory;
    id: string;
    trackIndex?: number;
    detachable?: boolean;
    parameters?: any[];
    active: boolean;
  },
  index: number,
  update: boolean = true
) => {
  const track = trackIndex ? store.tracks[trackIndex] : getSelectedTrack();
  if (track.compilingIds.find(compilingId => compilingId === id)) return;
  setSelectedTrack("compilingIds", (compilingIds: string[]) => [
    ...compilingIds,
    id,
  ]);

  const element = await createFaustElementFromFaustFactory({
    factory,
    id,
    detachable,
    active,
    parameters,
  });
  if (!element) {
    console.error("error while creating fxNode from faustFactory");
    return;
  }

  createRoot(() => {
    trackIndex =
      trackIndex !== undefined ? trackIndex : store.selection.trackIndex;
    setStore("tracks", trackIndex, "fxChain", fxChain =>
      ARRAY.insert(fxChain, index, element)
    );
    if (update) {
      updateFxChain(store.tracks[trackIndex].fxChain, store.rootNode);
    }

    let init1 = false;
    createEffect(() => {
      element.parameters.forEach(({ address, value, label }) => {
        if (element.node === track.pitchshifter && label === "shift") {
          element.node.setParamValue(address, value + track.semitones);
        } else {
          element.node.setParamValue(address, value);
        }
      });
    });

    let isInitialized = Initialized();
    createEffect(() => {
      if (!isInitialized(element.active)) return;
      updateFxChain(track.fxChain, store.rootNode);
    });

    setSelectedTrack("compilingIds", (compilingIds: string[]) =>
      compilingIds.filter(compilingId => compilingId !== id)
    );
  });

  return element;
};

const removeNodeFromFxChainInstrument = (id: string) =>
  batch(() => {
    getSelectedInstrument().fxChains.forEach((fxChain, index) => {
      setSelectedInstrument("fxChains", index, (fxChain: DSPElement[]) =>
        fxChain.filter(fx => fx.id !== id)
      );
      updateFxChain(fxChain, getEntryFxTrack(index).node);
    });
  });

const removeNodeFromFxChainTrack = (id: string, trackIndex?: number) => {
  const index =
    trackIndex !== undefined ? trackIndex : store.selection.trackIndex;
  setStore("tracks", index, "fxChain", fxChain =>
    fxChain.filter(fx => fx.id !== id)
  );
  setTimeout(
    () => updateFxChain(store.tracks[index].fxChain, store.rootNode),
    500
  );
};

const updateOrderFxChainTrack = (index1: number, index2: number) => {
  setSelectedTrack(
    "fxChain",
    produce((fxChain: DSPElement[]) => {
      var element = fxChain[index1];
      fxChain.splice(index1, 1);
      fxChain.splice(index2, 0, element);
    })
  );
  updateFxChain(getSelectedTrack().fxChain, store.rootNode);
};

const updateOrderFxChainInstrument = (index1: number, index2: number) =>
  batch(() => {
    getSelectedInstrument().fxChains.forEach((fxChain, index) => {
      setSelectedInstrument(
        "fxChains",
        index,
        produce((fxChain: FaustElement[]) => {
          var element = fxChain[index1];
          fxChain.splice(index1, 1);
          fxChain.splice(index2, 0, element);
        })
      );
      updateFxChain(fxChain, getEntryFxTrack(index).node);
    });
  });

const cloneFxChains = async (fxChains: DSPElement[][]) =>
  Promise.all(
    fxChains.map(fxChain =>
      Promise.all(
        fxChain.map(async fxElement => {
          if ("factoryId" in fxElement) {
            const factory = store.faustFactories.find(
              ({ id }) => id === (fxElement as FaustElement).factoryId
            );
            const node = await createFaustNode(factory!.node);
            return {
              ...(fxElement as FaustElement),
              id: zeptoid(),
              connection: undefined,
              parameters: deepClone((fxElement as FaustElement).parameters),
              node,
            };
          } else {
            const node = new GainNode(store.context!);
            return {
              ...(fxElement as WebAudioElement),
              id: zeptoid(),
              connection: undefined,
              node,
            };
          }
        })
      )
    )
  );

// TRACKS

const getSelectedTrack = () => store.tracks[store.selection.trackIndex];
const setSelectedTrack = (...args: any[]) =>
  setStore("tracks", store.selection.trackIndex, ...args);

const setSelectedTrackIndex = (index: number) => {
  setStore("selection", "trackIndex", index);
};

const toggleTrackMode = () => {
  setStore("playMode", playMode =>
    playMode === "composition" ? "pattern" : "composition"
  );
  if (store.playMode === "composition") {
    setStore("clockOffset", store.clock);
  }
};

const getTrackSemitones = (frequency: number, speed: number) => {
  const midi = ftom(frequency);
  return midi - ftom(ROOT_FREQUENCY * speed);
};

const getTrackShift = (index: number) => {
  const fxData = store.tracks[index].fxChain.find(
    fx => fx.node === store.tracks[index].pitchshifter
  );

  return (fxData as FaustElement).parameters.find(
    (parameter: FaustParameter) => parameter.label === "shift"
  );
};

const toggleTrackSolo = (index: number) => {
  if (store.solos.includes(index)) {
    if (store.keys.shift) {
      setStore("solos", solos => solos.filter(i => i !== index));
    } else {
      setStore("solos", []);
    }
  } else {
    if (store.keys.shift) {
      setStore("solos", solos => [...solos, index]);
    } else {
      setStore("solos", [index]);
    }
  }
};

// COMPOSITION

const getBlockIndex = (blockId: string) =>
  store.composition.findIndex(block => block.id === blockId);
const getCompositionBlockSize = (block: CompositionBlockProps) => {
  let count = 0;
  const walk = (block: CompositionBlockProps) => {
    if (block.type === "element") {
      count++;
    } else {
      count += block.size;
    }
  };
  walk(block);
  return count;
};
const getArrayCompositionBlockSize = (blocks: Composition) =>
  blocks.length > 0
    ? blocks.map(getCompositionBlockSize).reduce((a, b) => a + b)
    : 0;

const getCompositionSize = createMemo(() =>
  getArrayCompositionBlockSize(store.composition)
);

const dragComposition = (
  targetId: string,
  block: CompositionBlockProps,
  position: {
    x: number;
    y: number;
  }
) => {
  if (targetId === block.id) return;
  if (position.y > 48 && position.y < 52) return;

  if (!targetId) {
    if (store.composition.find(b => b === block)) return;
    setStore(
      "composition",
      produce(composition => composition.push(block))
    );
    return;
  }

  // if(position.y < 0) return

  const targetIndex = actions.getBlockIndex(targetId);
  const dragIndex = actions.getBlockIndex(block.id);

  if (
    (position.y < 50 && targetIndex > dragIndex) ||
    (position.y > 50 && targetIndex < dragIndex)
  )
    return;

  if (dragIndex === -1) {
    setStore(
      "composition",
      produce(composition => composition.splice(targetIndex, 0, block))
    );
    return;
  }
  setStore(
    "composition",
    produce(composition => moveInArray(composition, dragIndex, targetIndex))
  );
};

const startCompositionSelection = (
  elementOrGroup: CompositionGroupProps | CompositionElementProps
) => {
  setStore("selection", "composition", [elementOrGroup]);
};

const getRangeSelection = (
  from: CompositionBlockProps,
  to: CompositionBlockProps
) => {
  const firstIndex = store.composition.findIndex(block => block === from);
  const secondIndex = store.composition.findIndex(block => block === to);
  return firstIndex < secondIndex
    ? [firstIndex, secondIndex + 1]
    : [secondIndex, firstIndex + 1];
};

const endCompositionSelection = (block: CompositionBlockProps) => {
  const [from, to] = getRangeSelection(store.selection.composition[0], block);
  const selection = store.composition.slice(from, to);
  setStore("selection", "composition", selection);
};

const resetCompositionSelection = () =>
  setStore("selection", "composition", []);

const groupCompositionSelection = () => {
  if (store.selection.composition.length < 2) {
    return;
  }

  const colorId = JSON.stringify(
    store.selection.composition.map(v => {
      if ("color" in v) return v.color;
      return getPattern(v.patternId)!.color;
    })
  );

  const { hslRaw } = getPastelColor(colorId);

  const color = `hsl(${hslRaw[0]}, 85%, 85%)`;

  const group: CompositionGroupProps = {
    type: "group",
    id: zeptoid(),
    color: color,
    size: getArrayCompositionBlockSize(store.selection.composition),
    blocks: store.selection.composition,
  };

  const [from, to] = getRangeSelection(
    store.selection.composition[0],
    store.selection.composition[store.selection.composition.length - 1]
  );

  // const index = store.composition.findIndex(block => block === )

  setStore(
    "composition",
    produce(composition => composition.splice(from, to - from, group))
  );

  resetCompositionSelection();
};

const ungroupCompositionGroup = (group: CompositionGroupProps) => {
  const index = store.composition.findIndex(block => block === group);

  if (store.loopingBlock && store.loopingBlock.id === group.id) {
    resetLoopingBlock();
  }

  if (!index) {
    console.error("could not find the index", index);
  }

  setStore(
    "composition",
    produce(composition => composition.splice(index, 1, ...group.blocks))
  );
};

const renameIdsCompositionBlock = (block: CompositionBlockProps) => {
  const walk = (block: CompositionBlockProps) => {
    block = {
      ...block,
      id: zeptoid(),
    };

    if (block.type === "group")
      block.blocks = block.blocks.map(block => walk(block));

    return block;
  };
  return walk(block);
};

const duplicateCompositionSelection = () => {
  const lastBlock =
    store.selection.composition[store.selection.composition.length - 1];

  // TODO: figure out how to do nested block duplication
  const index = store.composition.findIndex(block => block === lastBlock);

  if (index === -1) {
    console.error("could not find block in composition");
    return;
  }

  const duplicate = store.selection.composition.map(block =>
    renameIdsCompositionBlock(block)
  );

  setStore(
    "composition",
    produce(composition => composition.splice(index + 1, 0, ...duplicate))
  );
  resetCompositionSelection();
};

const isElementInBlock = (
  element: CompositionElementProps,
  block: CompositionBlockProps
) => {
  if (block.type === "element") {
    return element === block;
  }

  const stack = [...block.blocks].reverse();

  while (stack.length > 0) {
    const b = stack.pop();
    if (!b) continue;

    if (b.id === element.id) return true;
    if ("blocks" in b) {
      stack.push(...b.blocks);
    }
  }

  console.log("couldnt find it i guess");
  return false;
};

const setLoopingBlock = (block: CompositionBlockProps) => {
  setStore("loopingBlock", { ...block });

  if (
    store.playingElementPattern &&
    isElementInBlock(store.playingElementPattern.element, block)
  ) {
    return;
  }

  const element = findFirstCompositionElement(block);
  if (!element) return;

  const pattern = getPattern(element.patternId);
  setStore("playingElementPattern", { element, pattern });
};

const resetLoopingBlock = () => setStore("loopingBlock", undefined);

// AUDIO-ENGINE

const updateAudioPipe = (
  instrument: Instrument,
  node: AudioNode | FaustAudioWorkletNode,
  trackIndex: number
) => {
  const fxChainTrack = store.tracks[trackIndex].fxChain;
  const fxEntryTrack = fxChainTrack[fxChainTrack.length - 1];

  const fxChainInstrument = instrument.fxChains[trackIndex];
  const fxEntryInstrument = fxChainInstrument[fxChainInstrument.length - 1];
  const fxExitInstrument = fxChainInstrument[0];

  if (fxEntryInstrument) {
    node.connect(fxEntryInstrument.node);
    fxExitInstrument.node.connect(
      fxEntryTrack?.node /*  || store.context.destination */
    );
  } else {
    node.connect(fxEntryTrack?.node /* || store.context.destination */);
  }
};

const playSampler = (
  instrument: Sampler,
  frequency: number,
  trackIndex: number
) => {
  const { audioBuffer, selection, speed } = instrument;

  if (!store.context || !audioBuffer) return;

  stopPreviousNoteTrack(trackIndex);

  const source = store.context.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = speed;

  updateAudioPipe(instrument, source, trackIndex);

  setStore("tracks", trackIndex, "playingInstrument", source);
  setStore("tracks", trackIndex, "instrumentIndex", instrument.index);

  const duration =
    (((selection.end - selection.start) * 128) / audioBuffer.length) *
    audioBuffer.duration;
  const start =
    ((selection.start * 128) / audioBuffer.length) * audioBuffer.duration;
  source.start(0, start, duration);

  const semitones = getTrackSemitones(frequency, Math.abs(speed));
  const shift = getTrackShift(trackIndex);
  const totalPitch = semitones + shift!.value;

  setStore("tracks", trackIndex, "semitones", semitones);
  setStore("tracks", trackIndex, "frequency", frequency);

  store.tracks[trackIndex].pitchshifter?.setParamValue(
    "/Pitch_Shifter/shift",
    totalPitch
  );

  return source;
};

const stopPreviousNoteTrack = (trackIndex: number) => {
  const playingInstrument = store.tracks[trackIndex].playingInstrument;

  if (!playingInstrument) return;
  if ("stop" in playingInstrument) {
    playingInstrument!.stop();
  } else {
    const gate = playingInstrument.parameters?.find(parameter =>
      parameter.address.includes("gate")
    );
    if (!gate) return;
    playingInstrument.node.setParamValue(gate.address, 0);
  }
};

const playSynth = (
  instrument: Synth,
  frequency: number,
  trackIndex: number
) => {
  const element = instrument.elements[trackIndex];
  if (!element.node) return;

  stopPreviousNoteTrack(trackIndex);

  updateAudioPipe(instrument, element.node, trackIndex);

  const freq = element.parameters?.find(parameter =>
    parameter.address.includes("freq")
  );
  const gate = element.parameters?.find(parameter =>
    parameter.address.includes("gate")
  );

  if (freq) {
    element.node.setParamValue(freq.address, frequency);
  }

  if (gate) {
    setTimeout(() => {
      element.node.setParamValue(gate.address, 1);
    }, 10);
    // setTimeout(() =>{
    //   instrument.element.node.setParamValue(gate.address, 0)
    // }, 5)
  }

  // TODO: this is a hack!!!
  // i have no idea why this code needs to be here but otherwise it will not play the sounds
  // needs further investigation at some point i guess
  const source = store.context!.createBufferSource();
  source.start();
  // end hack
  const shift = getTrackShift(trackIndex)?.value;
  if (shift)
    store.tracks[trackIndex].pitchshifter?.setParamValue(
      "/Pitch_Shifter/shift",
      shift
    );
  setStore("tracks", trackIndex, "instrumentIndex", instrument.index);
  setStore("tracks", trackIndex, "playingInstrument", element);
};

const playNote = (
  instrumentIndex: number,
  frequency: number,
  trackIndex: number
) => {
  const instrument = store.instruments[instrumentIndex];
  if (!instrument.active) return;

  switch (instrument.type) {
    case "synth":
      if (instrument.elements[trackIndex]) {
        playSynth(instrument, frequency, trackIndex);
      }
      break;
    case "sampler":
      if (instrument.audioBuffer) {
        playSampler(instrument, frequency, trackIndex);
      }
      break;
  }
};

const findNextPlayingCompositionElement = () => {
  let foundCurrentElement = false;

  if (store.loopingBlock && store.loopingBlock.type === "element")
    return store.loopingBlock;

  const stack = store.loopingBlock
    ? [...store.loopingBlock.blocks]
    : [...store.composition];

  const first = stack[0];

  let node;
  while (stack.length !== 0) {
    node = stack.shift()!;

    if ("blocks" in node) {
      stack.unshift(...node.blocks);
      continue;
    }
    if (node.id === store.playingElementPattern?.element.id) {
      foundCurrentElement = true;
      continue;
    }
    if (foundCurrentElement) {
      return node;
    }
  }

  return findFirstCompositionElement(first);
};

const renderAudio = () => {
  let pattern =
    store.playMode === "pattern" ||
    store.composition.length === 0 ||
    !store.playingElementPattern
      ? getSelectedPattern()
      : store.playingElementPattern.pattern;

  if (!pattern) return;

  pattern.sequences.forEach((sequence, track) => {
    const note = sequence[store.relativeClock];
    switch (note.type) {
      case "inactive":
        return;
      case "active":
        playNote(note.instrumentIndex, note.frequency, track);
        break;
      case "silence":
        stopPreviousNoteTrack(track);
        break;
    }
  });
};

const setDragging = (type: "fx" | "composition", data: any) =>
  setStore("dragging", type, data);

const addToEditors = (editor: EditorModalProps) => {
  if (store.editors.find(e => editor.id === e.id)) return;
  setStore("editors", editors => [...editors, editor]);
};
const removeFromEditors = (id: string) => {
  setStore("editors", editors =>
    editors.filter(editor => {
      return editor.id !== id;
    })
  );
};

const setCoding = (boolean: boolean) => setStore("bools", "coding", boolean);

const recordAudio = async (type: "file" | "resample" | "mic") => {
  if (!store.context) return;
  if (!store.audioRecorder) {
    if (type === "mic") {
      const microphoneStream = await getMicrophoneStream();
      if (!microphoneStream) {
        console.error("could not create microphonestream");
        return;
      }
      const recorder = new StreamRecorder(microphoneStream);
      setStore("audioRecorder", { type, recorder });
    } else {
      const recorder = new AudioNodeRecorder(store.rootNode!, store.context);
      setStore("audioRecorder", { type, recorder });
    }
  } else {
    const blob = await store.audioRecorder.recorder.stop();

    if (store.audioRecorder.type === "file") {
      const a = document.createElement("a");
      a.setAttribute("href", URL.createObjectURL(blob));
      a.setAttribute("download", "music.ogg");
      a.click();
    } else {
      const arrayBuffer = await blob.arrayBuffer();
      const sampler = defaultSampler(
        store.instruments.length,
        store.tracks.length
      );
      const unusedInstrument = getUnusedInstrument();
      sampler.fxChains = store.tracks.map(createPorts);
      sampler.fxChains.forEach(chain => updateFxChain(chain));

      if (unusedInstrument) {
        const index = unusedInstrument.index;
        sampler.color = unusedInstrument.color;
        setStore("instruments", index, sampler);
        setSelectedInstrumentIndex(index);
      } else {
        setStore("instruments", instruments => [...instruments, sampler]);
        setSelectedInstrumentIndex(store.instruments.length - 1);
      }

      const index = store.arrayBuffers.filter(({ name }) =>
        name.startsWith("recording")
      ).length;
      const name = `recording_${index}`;
      actions.addToArrayBuffers({ arrayBuffer, name });
      await setSamplerFromArrayBuffer({ arrayBuffer, name });
    }
    setStore("audioRecorder", undefined);
  }
};

const getMicrophoneStream = async () => {
  if (!store.mic) {
    setStore("mic", await getWebAudioMediaStream());
  }
  return store.mic;
};

const togglePlaying = () => {
  if (!store.bools.playing)
    setStore(
      "clockOffset",
      performance.now() - store.clock * bpmToMs(store.bpm)
    );

  setStore("bools", "playing", bool => !bool);
  if (store.bools.playing) {
    renderAudio();
  } else {
    store.tracks.forEach(track => {
      track.playingInstrument?.stop();
    });
  }
};

const resetPlaying = () => {
  batch(() => {
    store.tracks.forEach(track => {
      track.playingInstrument?.stop();
    });
    setStore("clock", 0);
    setStore("bools", "playing", false);
  });
};

// returns String
function getArrayBufferString(arrayBuffer: ArrayBuffer) {
  return new Uint8Array(arrayBuffer).toString();
}

// returns ArrayBuffer
function parseArrayBufferString(string: string) {
  return new Uint8Array(string.split(",")).buffer;
}

const serializeFxChain = (fxChain: DSPElement[]) =>
  fxChain
    .filter(
      element =>
        element.initialName !== "input" && element.initialName !== "output"
    )
    .map(element => ({
      initialName: element.initialName,
      id: element.id,
      factoryId:
        "factoryId" in element
          ? (element as FaustElement).factoryId
          : undefined,
      parameters:
        "parameters" in element
          ? (element as FaustElement).parameters
          : undefined,
    }));

const serializeTrack = (track: Track, index: number) => {
  const pitchshifter = track.fxChain.find(fx => fx.node === track.pitchshifter);

  if (!pitchshifter) {
    console.error("can not find pitcshifter", track.pitchshifter, index);
  }

  return {
    pitchshifterId: pitchshifter!.id,
    fxChain: serializeFxChain(track.fxChain),
  };
};

const serializeInstrument = (instrument: Instrument) => {
  const seperateData =
    instrument.type === "sampler"
      ? {
          type: "sampler",
          navigation: instrument.navigation,
          selection: instrument.selection,
          arrayBufferName: instrument.arrayBufferName,
          speed: instrument.speed,
          inverted: instrument.inverted,
        }
      : {
          type: "synth",
          code: instrument.code,
          parameters: instrument.elements[0].parameters,
        };

  const commonData = {
    color: instrument.color,
    fxChain: serializeFxChain(instrument.fxChains[0]),
  };

  return { ...seperateData, ...commonData };
};

class SerializeData {
  composition = store.composition;
  faustFactories = store.faustFactories.map(faustFactory => ({
    code: faustFactory.node.codes.dsp.code,
    id: faustFactory.id,
  }));
  instruments = store.instruments.map(serializeInstrument);
  patterns = store.patterns;
  arrayBuffers = store.arrayBuffers.map(({ name, arrayBuffer }) => ({
    name,
    arrayBuffer: getArrayBufferString(arrayBuffer),
  }));
  trackLength = store.tracks.length;
  tracks = store.tracks.map(serializeTrack);
}

const saveLocalSet = () => {
  const data = new SerializeData();

  download(JSON.stringify(data), "file.sprint");
};

const openLocalSet = async (data: SerializeData) => {
  setStore("bools", "playing", false);

  setStore("composition", data.composition);
  setStore("patterns", data.patterns);
  setStore(
    "arrayBuffers",
    data.arrayBuffers.map(({ name, arrayBuffer }) => ({
      name,
      arrayBuffer: parseArrayBufferString(arrayBuffer),
    }))
  );

  const faustFactories = await Promise.all(
    data.faustFactories.map(async ({ code, id }) => {
      const dsp = await compileFaust(code);

      if (!dsp.success) return undefined;
      const factory = createFactory(dsp.dsp, id);
      return factory;
    })
  );

  const tracks: Track[] = data.tracks.map(track => ({
    ...track,
    fxChain: createPorts(),
    compilingIds: [],
    frequency: 0,
    semitones: 0,
  }));

  /*   tracks[0].fxChain[0].node.gain.value = 0
  tracks[1].fxChain[0].node.gain.value = 0 */

  tracks.forEach((track, index) => {
    createEffect(() => {
      if (store.solos.length > 0 && !store.solos.includes(index)) {
        (track.fxChain[0].node as GainNode).gain.value = 0;
      } else {
        (track.fxChain[0].node as GainNode).gain.value = 1;
      }
    });
  });

  const instruments = await Promise.all(
    data.instruments.map(async (instrument, index) => {
      const commonData = {
        color: instrument.color,
        index,
        pan: 0,
        compilingIds: [],
        fxChains: store.tracks.map(() => createPorts()),
      };

      commonData.fxChains.forEach((fxChain, index) =>
        updateFxChain(fxChain, tracks[index].fxChain[1].node)
      );

      if (instrument.type === "sampler") {
        const arrayBuffer = store.arrayBuffers.find(
          ({ name }) => name === instrument.arrayBufferName
        );

        const { audioBuffer, waveform } = arrayBuffer
          ? await getAudioBufferAndWaveformFromArrayBuffer(
              arrayBuffer.arrayBuffer
            )
          : { audioBuffer: undefined, waveform: undefined };

        const sampler: Sampler = {
          type: "sampler",
          navigation: instrument.navigation!,
          selection: instrument.selection!,
          speed: instrument.speed!,
          inverted: instrument.inverted!,
          arrayBufferName: instrument.arrayBufferName,
          active: true,
          audioBuffer,
          waveform,
          ...commonData,
        };
        return sampler;
      } else {
        const synth: Synth = {
          type: "synth",
          code: instrument.code!,
          elements: [],
          speed: 0,
          active: true,
          ...commonData,
        };
        return synth;
      }
    })
  );

  store.disposes.forEach(dispose => dispose());

  setStore("instruments", instruments);
  setStore("tracks", tracks);

  setStore("faustFactories", faustFactories as FaustFactory[]);

  await Promise.all(
    data.tracks.map(async (track, trackIndex) => {
      await Promise.all(
        track.fxChain.map(async (fx, index) => {
          const factory = store.faustFactories.find(
            factory => factory.id === fx.factoryId
          );

          if (!factory) return;
          await createNodeAndAddToFxChainTrack(
            {
              trackIndex,
              factory,
              id: fx.id,
              active: true,
            },
            index + 1
          );
        })
      );

      updateFxChain(store.tracks[trackIndex].fxChain, store.rootNode);

      const pitchshifter = store.tracks[trackIndex].fxChain.find(
        fx => fx.id === track.pitchshifterId
      );

      if (pitchshifter)
        setStore("tracks", trackIndex, "pitchshifter", pitchshifter.node);
    })
  );

  await Promise.all(
    data.instruments.map(async (instrument, index) =>
      instrument.fxChain.map(async fx => {
        const factory = store.faustFactories.find(
          factory => factory.id === fx.factoryId
        );
        if (!factory) return;
        await createNodeAndAddToFxChainInstrument({
          factory,
          id: fx.id,
          active: true,
          instrument: store.instruments[index],
        });
      })
    )
  );

  setStore("bools", "playing", true);
};

const openContextMenu = ({
  e,
  options,
}: {
  e: MouseEvent;
  options: Choice[];
}) =>
  new Promise(resolve => {
    e.preventDefault();
    e.stopPropagation();
    setStore("contextmenu", {
      options,
      bottom: window.innerHeight - e.clientY,
      left: e.clientX,
      // idk why, but this 'resolve: resolve' needs to be written like this
      // otherwise it would execute resolve immediately
      resolve: resolve,
    });
  });

const closeContextMenu = () => {
  setStore("contextmenu", undefined);
};

const getAllSynthsInLocalStorage = () => {
  const entries = [];
  const keys = Object.keys(localStorage);
  let i = keys.length;

  while (i--) {
    if (keys[i].startsWith("SYNTH_")) {
      entries.push([keys[i], localStorage.getItem(keys[i])]);
    }
  }

  return entries as string[][];
};

const doesSynthExistInLocalStorage = (title: string) => {
  const keys = Object.keys(localStorage);
  return keys.includes("SYNTH_" + title);
};

const actions = {
  initContext,
  initFaust,
  initKeyboard,
  initTracks,
  initFx,
  initExtraFx,
  initClock,

  setBPM,
  setPlayMode,
  setSelectedFrequency,
  togglePlaying,
  resetPlaying,
  setRelativeClock,

  compileFaust,
  createFactory,
  updateFaustFactory,
  createFaustElementFromFaustFactory,

  addFx,
  createFaustNode,

  addInstrument,
  getSelectedInstrument,
  setSelectedInstrument,
  setSelectedInstrumentIndex,
  cloneSelectedInstrument,
  setInstrument,
  getColorInstrument,
  initInstruments,
  createNodeAndAddToFxChainInstrument,
  removeNodeFromFxChainInstrument,
  updateOrderFxChainInstrument,
  toggleTypeSelectedInstrument,
  setTypeSelectedInstrument,

  uploadAudioFile,
  addToArrayBuffers,

  setSamplerNavigation,
  setSamplerSelection,
  setSamplerWaveform,
  setSamplerAudioBuffer,
  setSamplerSpeed,
  revertSamplerAudiobuffer,
  setSamplerFromArrayBuffer,

  setSynthCode,
  playNote,
  getAllSynthsInLocalStorage,
  doesSynthExistInLocalStorage,

  toggleTrackMode,
  setSelectedTrackIndex,
  getSelectedTrack,
  toggleTrackSolo,
  createNodeAndAddToFxChainTrack,
  removeNodeFromFxChainTrack,
  updateOrderFxChainTrack,

  setSelectedPatternId,
  incrementSelectedPatternId,
  getSelectedPattern,
  clearSelectedPattern,
  duplicateSelectedPattern,
  duplicatePattern,
  getPatternIndex,
  getPatternColor,
  createPattern,

  getBlockIndex,

  setDragging,
  dragComposition,
  startCompositionSelection,
  endCompositionSelection,
  resetCompositionSelection,
  groupCompositionSelection,
  ungroupCompositionGroup,
  duplicateCompositionSelection,

  setLoopingBlock,
  resetLoopingBlock,

  renderAudio,
  addToEditors,
  removeFromEditors,
  setCoding,

  recordAudio,
  getParametersFromDsp,
  saveLocalSet,
  openLocalSet,
  openContextMenu,
  closeContextMenu,
};

export { store, setStore, actions };
