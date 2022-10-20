import deepClone from "deep-clone";
import Faust2WebAudio, { Faust } from "faust2webaudio";
import { TCompiledDsp } from "faust2webaudio/src/types";
import randomColor from "randomColor";
import { batch } from "solid-js";
import { createStore, produce, StoreSetter } from "solid-js/store";
import zeptoid from "zeptoid";

import { INSTRUMENT_AMOUNT, PITCHSHIFTER, REVERB, ROOT_FREQUENCY, SEQUENCE_LENGTH, TRACK_AMOUNT } from "./constants";
import collectParameters from "./faust/collectParameters";

import bpmToMs from "./helpers/bpmToMs";
import cloneAudioBuffer from "./helpers/cloneAudioBuffer";
import ftom from "./helpers/ftom";
import getLocalPosition from "./helpers/getLocalPosition";
import { FaustFactory, FxNode, FxParameter, Instrument, Note, Pattern, Sampler, Track, Waveform } from "./types";
import audioBufferToWaveform from "./waveform/audioBufferToWaveform";
import ARRAY from "./helpers/ARRAY";


const initSequence = () : Note[] => 
  Array(SEQUENCE_LENGTH)
    .fill(0)
    .map(() => ({
      active: false
    }))

const initPattern = () : Pattern => ({
  id: "first",
  color: randomColor(),
  sequences: Array(TRACK_AMOUNT)
  .fill(0)
  .map(initSequence)
})

const [store, setStore] = createStore<{
  faust?: Faust
  context?: AudioContext
  clock: number
  clockOffset: number
  bpm: number
  playMode: "pattern" | "composition"
  patterns: Pattern[]
  tracks: Track[]
  composition: ({id: string, patternId: string})[]
  faustFactories: FaustFactory[],
  instruments: (Instrument)[]
  editors: {
    id: string
    code: string
    oncompile: (dsp: TCompiledDsp) => void
  }[]
  selection: {
    frequency: number
    instrumentIndex: number
    patternId: string
    blockId?: string
    trackIndex: number
  },
  keys: {
    shift: boolean,
    control: boolean
  },
  dragging: {
    fx: {
      id: string
      name: string
      detachable: boolean
      parameters?: any[]
      active?: boolean
    } | undefined
  }
}>({
  clock: -1,
  faust: undefined,
  context: new window.AudioContext(),
  playMode: "pattern",
  clockOffset: 0,
  bpm: 120,
  patterns: [initPattern()],
  composition: [],
  tracks: Array(TRACK_AMOUNT).fill(0).map(()=>({
    instrument: undefined,
    semitones: 0,
    frequency: 0,
    fxChain: [],
    compilingIds: []
  })),
  instruments: Array(INSTRUMENT_AMOUNT)
    .fill(0)
    .map((_,i) =>
      ({
        active: true,
        index: i,
        type: "synth",
        code: "",
        node: undefined,
        color: "",
        pan: 0,
        fxChains: [[]],
        speed: 1,
        compilingIds: []
      })
  ),
  editors: [],
  selection: {
    frequency: ROOT_FREQUENCY,
    instrumentIndex: 0,
    patternId: "first",
    blockId: undefined,
    trackIndex: 0
  },
  keys: {
    shift: false,
    control: false
  },
  faustFactories: [],
  dragging: {
    fx: undefined
  }
})

const initContext = () => {
  const context = new window.AudioContext()
  setStore("context", context)
}

const initFaust = async () => {
  const faust = new Faust({
    wasmLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.wasm",
    dataLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.data",
  })
  await faust.ready
  setStore("faust", faust)
}

const initKeyboard = () => {
  window.onkeydown = (e) => {
    switch(e.code){
      case "ShiftLeft":
      case "ShiftRight":
        setStore("keys", "shift", true);
        break;
      case "ControlLeft":
      case "ControlRight":
        setStore("keys", "control", true);
        break;
    }
  }
  window.onkeyup = (e) => {
    switch(e.code){
      case "ShiftLeft":
      case "ShiftRight":
        setStore("keys", "shift", false);
        break;
      case "ControlLeft":
      case "ControlRight":
        setStore("keys", "control", false);
        break; 
    }
  }
}

const compileFaust = (code: string) => {
  try{
    
    return store.faust?.compileCodes(code, ["-I", "libraries/"], true)
  }catch(err){
    console.error("code can not comipe: ", code, err)
  }}
const createFactory = (dsp: TCompiledDsp, name: string) => ({
  dsp: Object.setPrototypeOf(dsp, {}),
  name,
  parameters: collectParameters(dsp),
  id: zeptoid()
})
const addToFxFactories = (fx: FaustFactory) => setStore("faustFactories", (faustFactories) => [...faustFactories, fx])


/* const compileFaust = async (code: string, name: string) =>  {

  const compiledDsp = await store.faust?.compileCodes(code, ["-I", "libraries/"], true);

  if(!compiledDsp) return;

  const fx = {
    dsp: Object.setPrototypeOf(compiledDsp, {}),
    name,
    parameters: collectParameters(compiledDsp)
  }

  setStore("faustFactories", (faustFactories) => [...faustFactories, fx])

  return compiledDsp;
} */

const createFaustNode = async (dsp: TCompiledDsp) : Promise<Faust2WebAudio.FaustAudioWorkletNode | undefined>=> {
  if(!store.faust || !store.context) return undefined
  const optionsIn = { compiledDsp: dsp, audioCtx: store.context, args: { "-I": "libraries/" }};

  dsp.shaKey += zeptoid();

  const node = await store.faust.getAudioWorkletNode(optionsIn);

  return node;
}

const setSelectedInstrumentIndex = (index: number) => setStore("selection", "instrumentIndex", index)
const getSelectedInstrument = () => store.instruments[store.selection.instrumentIndex]


const initFx = async () => {
  setStore("faustFactories", []);

  const [reverb, pitchshifter] = await Promise.all([
    compileFaust(REVERB),
    compileFaust(PITCHSHIFTER)
  ])

  

  if(reverb) addToFxFactories(createFactory(reverb, "reverb"))
  if(pitchshifter) addToFxFactories(createFactory(pitchshifter, "pitchshifter"))

}



const initTracks = async () => {
  batch(()=> {
    const compiledPitchshifter = store.faustFactories.find(fx => fx.name === "pitchshifter");

    if(!compiledPitchshifter) return;
  
    store.tracks.forEach(async (_, index) => {
      const pitchshifter = await createNodeAndAddToFxChainTrack({
        factory: compiledPitchshifter, 
        id: "pitchshifter", 
        trackIndex: index,
        detachable: false,
        active: true
      }, 0)

      

      if(!pitchshifter) return;

      setStore("tracks", index, "pitchshifter", pitchshifter.node);
    })
  })
}

const initInstruments = async () => {
  if(!store.context) return;
  for(let i = 0; i < INSTRUMENT_AMOUNT; i++){
    const fxChains = new Array(store.tracks.length).fill(0).map(v=>[]);
    setStore("instruments", i, {
      active: true,
      index: i,
      type: "sampler",
      navigation: {
        start: 0,
        end: 0,
      },
      selection: {
        start: 0,
        end: 0
      },        
      src: undefined,
      waveform: undefined,
      color: randomColor(),
      fxChains: fxChains,
      speed: 1,
      inverted: false,
      compilingIds: []
    })
  }
}




const setBPM = (bpm: StoreSetter<number, ["bpm"]>, offset: number) => {
  batch(()=>{
    setStore("bpm", bpm)
    const clockOffset = (store.clock) * bpmToMs(store.bpm)
    setStore("clockOffset", performance.now() - clockOffset);
  })
} 

const toggleTypeSelectedInstrument = () => {
  const instrument = getSelectedInstrument()
  if(!instrument.active) return;
  const instrumentType = instrument.type === "synth" ? "sampler" : "synth"
  setStore("instruments", store.selection.instrumentIndex, "type", instrumentType)
}

const setInstrument = (i: number, instrument: StoreSetter<Instrument, [number, "instruments"]> ) => 
  setStore("instruments", i, instrument)

const setSelectedInstrument = function(...args: any[]){
  setStore("instruments", store.selection.instrumentIndex , ...args)
}

const setSamplerNavigation = (type: "start" | "end", value: ((x: number) => number) | number) => 
  setSelectedInstrument("navigation", type, value);

const setSamplerSelection = (type: "start" | "end", value: ((x: number) => number) | number) => 
  setSelectedInstrument("selection", type, value)

const setSamplerWaveform = (waveform: Waveform) => 
  setSelectedInstrument("waveform", waveform)

const setSamplerAudioBuffer = (audioBuffer: AudioBuffer) => 
  setSelectedInstrument("audioBuffer", audioBuffer)

const setSamplerSpeed = (speed: StoreSetter<number, ["speed"]>) => {
  batch(() => {
    setSelectedInstrument("speed", speed);
    const sampler = (getSelectedInstrument() as Sampler)
    if(sampler.speed < 0 && !sampler.inverted || sampler.speed > 0 && sampler.inverted){
      revertSamplerAudiobuffer();
      setSelectedInstrument("inverted", (inverted: boolean) => !inverted);
    }
    store.tracks.forEach((track, index) => {
      if(track.instrument === sampler){
        const speed = sampler.speed;
        if(track.source){
          track.source.playbackRate.value = speed;
  
          const semitones = getTrackSemitones(track.frequency, Math.abs(speed))
          const shift = getTrackShift(index);
          const totalPitch = semitones + shift!.value;
        
          track.pitchshifter?.setParamValue("/Pitch_Shifter/shift", totalPitch)
        }
      }
    })
  })

}

const revertSamplerAudiobuffer = async () => {
  const {audioBuffer, waveform, selection, navigation} = getSelectedInstrument() as Sampler;
  
  if(!store.context || !audioBuffer || !waveform) return;

  const clonedBuffer = cloneAudioBuffer(audioBuffer, store.context);
  Array.prototype.reverse.call( clonedBuffer.getChannelData(0) );
  Array.prototype.reverse.call( clonedBuffer.getChannelData(1) ); 
  setSelectedInstrument("audioBuffer", clonedBuffer)
  
  const clonedBuffer2 = cloneAudioBuffer(clonedBuffer, store.context);
  const reversedWaveform = await audioBufferToWaveform(clonedBuffer2, store.context)
  actions.setSamplerWaveform(reversedWaveform);

  var {start, end} = selection;
  setSamplerSelection("start", waveform.length - end)
  setSamplerSelection("end", waveform.length - start)

  var {start, end} = navigation;
  setSamplerNavigation("start", end)
  setSamplerNavigation("end", start)
}

const getColorInstrument = (instrumentIndex: number) => {
  const instrument = store.instruments[instrumentIndex];
  if(instrument.active){
    return instrument.color;
  }
  return ""
} 


const incrementSelectedPatternId = (e: MouseEvent) => {
  const offset = getLocalPosition(e).percentage.y > 50 ? 1 : -1
  const index = store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)
  
  let nextIndex = (index + offset) % store.patterns.length
  if (nextIndex < 0) nextIndex = store.patterns.length - 1

  setStore("selection", "patternId", store.patterns[nextIndex].id)
}
const setSelectedPatternId = (id: string) => setStore("selection", "patternId", id);  
const getSelectedPattern = () => store.patterns.find(pattern => pattern.id === store.selection.patternId)
const getSelectedPatternIndex = () => store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)

const clearSelectedPattern = () => setStore("patterns", getSelectedPatternIndex(), initPattern())
const copySelectedPattern = () => {
  const clonedPattern = JSON.parse(JSON.stringify(store.patterns[getSelectedPatternIndex()]))
  clonedPattern.id = zeptoid()
  clonedPattern.color = randomColor();

  setStore("patterns", produce((patterns: Pattern[]) => patterns.splice(getSelectedPatternIndex() + 1, 0, clonedPattern)))
  setStore("selection", "patternId", clonedPattern.id)
}


const createFxNodeFromFaustFactory = async (
  {
    factory, id, detachable, active
  } 
  : {
    factory: FaustFactory, 
    id: string, 
    detachable?: boolean
    active: boolean
  }

) : Promise<FxNode | undefined>=> {
  const faustNode = await createFaustNode(factory.dsp);
  if(!faustNode) return undefined; 
  return {
    id,
    node: faustNode,
    name: factory.name,
    parameters: deepClone(factory.parameters),
    prev: undefined,
    detachable: detachable === undefined ? true : detachable,
    active
  }
}

const updateFxChain = (fxChain: FxNode[]) => {
  const [_, setFxChain] = createStore(fxChain);
  const context = store.context;
  if(!context) return
  fxChain.forEach((fxNode: FxNode, index: number) => {
    if(index === 0) return
    const prev = /* index === 0 ? context.destination : */ fxChain[index - 1].node
    if(fxNode.prev === prev) return;

    

    if(fxNode.prev){
      fxNode.node.disconnect(fxNode.prev);
    }
    fxNode.node.connect(prev)
    // setFxChain(index, "prev", prev);
  })
}

const createNodeAndAddToFxChainInstrument = async (
  {factory, id, detachable, parameters, active} : 
  {factory: FaustFactory, id: string, detachable?: boolean, parameters?: any[], active: boolean}
) => {

  if(getSelectedInstrument().compilingIds.find(compilingId => compilingId === id)) return;
  setSelectedInstrument("compilingIds", (compilingIds: string[]) => [...compilingIds, id]);

  const nodes = await Promise.all(
    getSelectedInstrument().fxChains.map((_,i) => createFxNodeFromFaustFactory({factory, id, detachable, active}))
  )

  batch(() => {
    let error;
    nodes.forEach((fxNode, i) => {
      if(!fxNode){
        error = true
        return;
      }
      if(parameters)
        fxNode.parameters = parameters;
      setSelectedInstrument("fxChains", i, (fxChain: FxNode[]) =>[...fxChain, fxNode]) 
    })
    if(error) return;
    getSelectedInstrument().fxChains.forEach(fxChain => updateFxChain(fxChain))
  })

  setSelectedInstrument("compilingIds", (compilingIds: string[]) => 
    compilingIds.filter(compilingId => compilingId  !== id)
  );
}

const createNodeAndAddToFxChainTrack = async (
  {factory, id, trackIndex, detachable, parameters, active} 
  : {
    factory: FaustFactory
    id: string
    trackIndex?: number
    detachable?: boolean
    parameters?: any[]
    active: boolean
  }, 
  index: number
) => {
  const track = trackIndex ? store.tracks[trackIndex] : getSelectedTrack();
  if(track.compilingIds.find(compilingId => compilingId === id)) return;
  setSelectedTrack("compilingIds", (compilingIds: string[]) => [...compilingIds, id]);

  const fxNode = await createFxNodeFromFaustFactory({factory, id, detachable, active})
  if(!fxNode){
    console.error("error while creating fxNode from faustFactory");
    return;
  }

  if(parameters)
    fxNode.parameters = parameters;
  
  trackIndex = trackIndex !== undefined ? trackIndex : store.selection.trackIndex;
  setStore("tracks", trackIndex, "fxChain", (fxChain) => ARRAY.insert(fxChain, index, fxNode))
  updateFxChain(store.tracks[trackIndex].fxChain)

  if(store.context && store.tracks[trackIndex].fxChain.length > 0)
    store.tracks[trackIndex].fxChain[0].node.connect(store.context?.destination);

  setSelectedTrack("compilingIds", (compilingIds: string[]) => 
    compilingIds.filter(compilingId => compilingId  !== id)
  );
  return fxNode;
}

const removeNodeFromFxChainInstrument = (
  id: string
) => batch(()=>{
  getSelectedInstrument().fxChains.forEach((fxChain, index) => {
    setSelectedInstrument("fxChains", index, (fxChain: FxNode[]) => fxChain.filter(fx => fx.id !== id))
    updateFxChain(fxChain)
  })
})

const removeNodeFromFxChainTrack = (
  id: string,
  trackIndex?: number
) => {
  const index = trackIndex !== undefined ? trackIndex : store.selection.trackIndex;
  setStore("tracks", index, "fxChain", (fxChain) => fxChain.filter(fx => fx.id !== id))
  setTimeout(()=>updateFxChain(store.tracks[index].fxChain), 500)
}

const updateOrderFxChainTrack = (
  index1: number,
  index2: number
) => {
  setSelectedTrack("fxChain", produce((fxChain: FxNode[]) => {
      var element = fxChain[index1];
      fxChain.splice(index1, 1);
      fxChain.splice(index2, 0, element);
  }))
  updateFxChain(getSelectedTrack().fxChain)
}


const updateOrderFxChainInstrument = (
  index1: number,
  index2: number
) => batch(()=>{
  getSelectedInstrument().fxChains.forEach((fxChain, index) => {
    setSelectedInstrument("fxChains", index, produce((fxChain: FxNode[]) => {
      var element = fxChain[index1];
      fxChain.splice(index1, 1);
      fxChain.splice(index2, 0, element);
    
    }))
    updateFxChain(fxChain)
  })
})


const getSelectedTrack = () => store.tracks[store.selection.trackIndex]
const setSelectedTrack = (...args: any[]) => 
  setStore("tracks", store.selection.trackIndex, ...args); 

const setSelectedTrackIndex = (index: number) => {
  setStore("selection", "trackIndex", index);
}

const toggleTrackMode = () => {
  setStore("playMode", (playMode) => playMode === "composition" ? "pattern" : "composition");
  if(store.playMode === "composition"){
    setStore("clockOffset", store.clock);
  }
}

const getPatternIndex = (patternId: string) => store.patterns.findIndex(pattern =>pattern.id === patternId)
const getPatternColor = (patternId: string) =>  store.patterns.find(pattern =>pattern.id === patternId)?.color || ""

const getBlockIndex = (blockId: string) => store.composition.findIndex(block => block.id === blockId) 

const getTrackSemitones = (frequency: number, speed: number) => {
  const midi = ftom(frequency);
  return midi - ftom(ROOT_FREQUENCY * speed);
}

const getTrackShift = (index: number) => {
  const fxData = store.tracks[index].fxChain.find(fx => fx.name === "pitchshifter");
  return fxData!.parameters.find((parameter: FxParameter) => parameter.label === "shift");
}

function playSampler(instrument: Sampler, trackIndex: number, frequency: number) {
  const {audioBuffer, selection, speed} = instrument;

  if(!store.context || !audioBuffer) return;
  if(store.tracks[trackIndex].source){
    store.tracks[trackIndex].source!.stop();
  }
  const source = store.context.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = speed;

  const fxChainTrack = store.tracks[trackIndex].fxChain;
  const fxEntryTrack = fxChainTrack[fxChainTrack.length - 1];

  const fxChainInstrument = instrument.fxChains[trackIndex];
  const fxEntryInstrument = fxChainInstrument[fxChainInstrument.length - 1];
  const fxExitInstrument = fxChainInstrument[0];

  if(fxEntryInstrument){
    source.connect(fxEntryInstrument.node)
    fxExitInstrument.node.connect(fxEntryTrack?.node || store.context.destination)
  }else{
    source.connect(fxEntryTrack?.node || store.context.destination)
  }
  

  setStore("tracks", trackIndex, "source", source);
  // setStore("tracks", trackIndex, "instrument", instrument);
  setStore("tracks", trackIndex, "instrumentIndex", instrument.index)

  const duration = ((selection.end - selection.start) * 128  ) / audioBuffer.length * (audioBuffer.duration ) ;
  const start = (selection.start * 128) / audioBuffer.length * audioBuffer.duration;
  source.start(0, start, duration);

  const semitones = getTrackSemitones(frequency, Math.abs(speed))
  const shift = getTrackShift(trackIndex);
  const totalPitch = semitones + shift!.value;

  setStore("tracks", trackIndex, "semitones", semitones);
  setStore("tracks", trackIndex, "frequency", frequency);

  store.tracks[trackIndex].pitchshifter?.setParamValue("/Pitch_Shifter/shift", totalPitch)
}

const playNote = (instrumentIndex: number, frequency: number, track: number) => {
  const instrument = store.instruments[instrumentIndex];
  if(!instrument.active) return;

  switch(instrument.type){
    case "synth":
      if(instrument.node){
        instrument.node.setParamValue(
          "/FaustDSP/freq",
          frequency
        )
        instrument.node.setParamValue("/FaustDSP/drop", 0.9 + ((store.clock / 10000) % 0.1))
      }
      break;
    case "sampler":
      if(instrument.audioBuffer){
        playSampler(instrument, track, frequency)
      }
      break;
  }
}

const renderAudio = () => {
  let pattern;
  if(store.playMode === "composition"){
    const totalLength = store.composition.length * SEQUENCE_LENGTH;
    const compositionClock = (store.clock - store.clockOffset);
    const index = Math.floor(compositionClock / SEQUENCE_LENGTH);
    if(compositionClock/totalLength > 1) setStore("clockOffset", store.clock);

    const block = store.composition[index];
    if(!block) {
      pattern = getSelectedPattern()
    }else{
      const {patternId, id} = store.composition[index];
      pattern = store.patterns.find(pattern => pattern.id === patternId);
      setStore("selection", "blockId", id);
      setStore("selection", "patternId", patternId);

    }
  }else{
    pattern = getSelectedPattern()
  }

  if(!pattern) return;
  const tick = store.clock % pattern.sequences[0].length;
  let activeInstruments : {[key: string]: any}= {};
  pattern.sequences.forEach((sequence, track) => {
    const note = {...sequence[tick], track};
    if(note.active){
      playNote(note.instrumentIndex, note.frequency, note.track)
    }
  })
}

const setDragging = (type: "fx", data: any) => setStore("dragging", type, data)

const addToEditors = (editor: {
  id: string
  code: string
  oncompile: (dsp: TCompiledDsp) => void
}) => {
  if(store.editors.find(e => editor.id === e.id)) return;
  setStore("editors", (editors) => [...editors, editor])
}
const removeFromEditors = (id: string) => {
  
  setStore("editors", (editors) => editors.filter((editor) => {
    
    return editor.id !== id
  }))
}

const actions = {
  initFaust, initKeyboard, initTracks, initFx, /* initCodeMirror, */
  setBPM,
  compileFaust, createFactory,
  getSelectedInstrument, setSelectedInstrumentIndex, setSelectedInstrument,
  setInstrument, getColorInstrument, initInstruments,
  createNodeAndAddToFxChainInstrument, removeNodeFromFxChainInstrument, updateOrderFxChainInstrument,
  toggleTypeSelectedInstrument, 
  setSamplerNavigation, setSamplerSelection, 
  setSamplerWaveform, setSamplerAudioBuffer,
  setSamplerSpeed, revertSamplerAudiobuffer,
  createFaustNode, 
  playNote, 
  toggleTrackMode, 
  setSelectedTrackIndex,
  getSelectedTrack,
  createNodeAndAddToFxChainTrack, removeNodeFromFxChainTrack, updateOrderFxChainTrack,
  setSelectedPatternId, incrementSelectedPatternId, getSelectedPattern, clearSelectedPattern, copySelectedPattern, 
  getPatternIndex, getPatternColor,
  getBlockIndex,
  renderAudio,
  setDragging,
  addToEditors, removeFromEditors
}


export { store, setStore, actions };

