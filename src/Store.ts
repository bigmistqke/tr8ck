import Faust2WebAudio, { Faust, FaustAudioWorkletNode } from "faust2webaudio"
import { createStore, produce, StoreSetter } from "solid-js/store"
import { SEQUENCE_AMOUNT, SEQUENCE_LENGTH, INSTRUMENT_AMOUNT, DEFAULT_CODE, PITCHSHIFTER, ROOT_FREQUENCY, REVERB } from "./constants"
import { Indices, Note, Inactive, Pattern, Waveform, FxParameter, Instrument } from "./types"
import randomColor from "randomColor";
import zeptoid from "zeptoid";
import getLocalPosition from "./helpers/getLocalPosition";
import ftom from "./helpers/ftom";
import { TFaustUIItem, TFaustUIGroup, FaustScriptProcessorNode } from "faust2webaudio/src/types";
import fals from "fals"

const initSequence = () : Note[] => 
  Array(SEQUENCE_LENGTH)
    .fill(0)
    .map(() => ({
      active: false
    }))

const initPattern = () : Pattern => ({
  id: "first",
  color: randomColor(),
  sequences: Array(SEQUENCE_AMOUNT)
  .fill(0)
  .map(initSequence)
})

const [store, setStore] = createStore<{
  clock: number
  faust?: Faust
  context?: AudioContext
  trackMode: "micro" | "macro"
  clockOffset: number
  bpm: number
  patterns: Pattern[]
  tracks: {
    source?: AudioBufferSourceNode 
    pitch: number
    selected: boolean
    fxChain: {
      name: string, 
      node: Faust2WebAudio.FaustAudioWorkletNode,
      parameters: FxParameter[]
    }[]
    pitchshifter: Faust2WebAudio.FaustAudioWorkletNode
  }[]
  composition: ({id: string, patternId: string})[]
  instruments: (Instrument)[][]
  selection: {
    frequency: number
    instrumentIndices: Indices
    patternId: string
    blockId?: string
    track: number
  },
  keys: {
    shift: boolean,
    control: boolean
  }
}>({
  clock: -1,
  faust: undefined,
  context: undefined,
  trackMode: "micro",
  clockOffset: 0,
  bpm: 120,
  patterns: [initPattern()],
  composition: [],
  tracks: Array(SEQUENCE_AMOUNT).fill({
    instrument: undefined,
    pitch: 0,
    fxChain: []
  }),
  instruments: Array(INSTRUMENT_AMOUNT)
    .fill(0)
    .map(() =>
      Array(INSTRUMENT_AMOUNT)
        .fill(0)
        .map(() => ({
          active: true,
          type: "synth",
          code: "",
          node: undefined,
          color: "",
          pan: 0,
          fxChain: [],
          speed: 1
        })
    )
  ),
  selection: {
    frequency: ROOT_FREQUENCY,
    instrumentIndices: [0,0],
    patternId: "first",
    blockId: undefined,
    track: 0
  },
  keys: {
    shift: false,
    control: false
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

const createFaustNode = async (code: string) : Promise<Faust2WebAudio.FaustAudioWorkletNode | undefined>=> {
  if(!store.faust || !store.context) return undefined
  return await store.faust.getNode(code, {
    // id: zeptoid(),
    // whatever:"ok",
    audioCtx: store.context,
    useWorklet: true,
    args: { "-I": "libraries/" },
  })
}

const setSelectedInstrumentIndices = (i: number, j: number) => setStore("selection", "instrumentIndices", [i, j])
const getSelectedInstrument = () => store.instruments[store.selection.instrumentIndices[0]][store.selection.instrumentIndices[1]]

const collectParameters = (node: FaustAudioWorkletNode) => {
  if(!node) return []
  let parameters : FxParameter[] = [];
  const walk = (node: TFaustUIItem) => {
    if("items" in node){
      node.items.forEach(item => walk(item))
    }else{
      console.log(node);
      if(!("step" in node) || fals(node.step) || !("init" in node) || fals(node.init)) {
        console.error('this parameter is an output parameter?', node);
        return;
      }
      parameters.push({
        address: node.address,
        label: node.label,
        max: node.max || 1,
        min: node.min || 0,
        step: node.step || 0.1,
        value: node.init || 0.5,
        init: node.init || 0.5
      });
    }
  }
  node.dspMeta.ui.forEach((node: TFaustUIGroup)=> walk(node))
  return parameters;
}

const initTracks = async () => {
  console.log("initTracks");
  const pitchshifters = await Promise.all(
    store.tracks.map(async (track, i) => await createFaustNode(PITCHSHIFTER))
  )
  console.log(pitchshifters[0] === pitchshifters[1])
  
  const reverbs = await Promise.all(
    store.tracks.map(async (track, i) => await createFaustNode(REVERB))
  )
  pitchshifters.forEach((pitchshifter, index) => {
    const reverb = reverbs[index];
    if(!store.context || !pitchshifter || !reverb) return;

    const ps = {
      name: "pitchshifter", 
      node: pitchshifter, 
      parameters: collectParameters(pitchshifter)
    }
    const rv = {
      name: "reverb",
      node: reverb,
      parameters: collectParameters(reverb)
    }

    pitchshifter.connect(store.context.destination)
    reverb.connect(pitchshifter);
    setStore("tracks", index, "fxChain", [ps, rv]);
    setStore("tracks", index, "pitchshifter", pitchshifter);
  })

/*   setStore("tracks", 0, "pitchshifter", pitchshifters[0]);
  setStore("tracks", 1, "pitchshifter", pitchshifters[1]); */
/*   window.ps0 = pitchshifters[0];
  window.ps1 = pitchshifters[1];
  window.ps0.connect(store.context!.destination)
  window.ps1.connect(store.context!.destination)

  let ps = {
    name: "pitchshifter", 
    node: pitchshifters[0], 
    parameters: collectParameters(pitchshifters[0])
  }
  setStore("tracks", 0, "fxChain", [ps]);

  ps = {
    name: "pitchshifter", 
    node: pitchshifters[0], 
    parameters: collectParameters(pitchshifters[1])
  }
  setStore("tracks", 1, "fxChain", [ps]); */


  console.log(store.tracks[0].pitchshifter === store.tracks[1].pitchshifter)
  console.log(pitchshifters[0] === store.tracks[0].pitchshifter)

  console.log(store.tracks[0].pitchshifter, store.tracks[1].pitchshifter)
}

const initInstruments = async () => {
  if(!store.context) return;
  for(let i = 0; i < INSTRUMENT_AMOUNT; i++){
    for(let j = 0; j < INSTRUMENT_AMOUNT; j++){
/*       const node = await createFaustNode(DEFAULT_CODE)
      if(!node) return */

      setStore("instruments", i, j, {
        active: true,
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
        fxChain: [],
        speed: 1
      })
    }
  }
}

const toggleTypeSelectedInstrument = () => {
  const instrument = getSelectedInstrument()
  if(!instrument.active) return;
  const [i, j] = store.selection.instrumentIndices
  const instrumentType = instrument.type === "synth" ? "sampler" : "synth"
  setStore("instruments", i, j, "type", instrumentType)
}

const setSelectedSampler = function(...args: any[]){
  const [x, y] = store.selection.instrumentIndices;
  setStore("instruments", x, y, ...args)
}

const setSamplerNavigation = (type: "start" | "end", value: ((x: number) => number) | number) => 
  setSelectedSampler("navigation", type, value);

const setSamplerSelection = (type: "start" | "end", value: ((x: number) => number) | number) => 
  setSelectedSampler("selection", type, value)

const setSamplerWaveform = (waveform: Waveform) => 
  setSelectedSampler("waveform", waveform)

const setSamplerAudioBuffer = (audioBuffer: AudioBuffer) => 
  setSelectedSampler("audioBuffer", audioBuffer)




const getColorInstrument = (indices: Indices) => {
  const instrument = store.instruments[indices[0]][indices[1]];
  if(instrument.active){
    return instrument.color;
  }
  return ""
} 


const getSelectedPattern = () => store.patterns.find(pattern => pattern.id === store.selection.patternId)

const getSelectedPatternIndex = () => store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)

const clearSelectedPattern = () => setStore("patterns", getSelectedPatternIndex(), initPattern())
const copySelectedPattern = () => {
  console.log("hallo")
  const clonedPattern = JSON.parse(JSON.stringify(store.patterns[getSelectedPatternIndex()]))
  clonedPattern.id = zeptoid()
  clonedPattern.color = randomColor();
  console.log(clonedPattern);
  setStore("patterns", produce((patterns: Pattern[]) => patterns.splice(getSelectedPatternIndex() + 1, 0, clonedPattern)))
  setStore("selection", "patternId", clonedPattern.id)
}




const incrementSelectedPattern = (e: MouseEvent) => {
  const offset = getLocalPosition(e).percentage.y > 50 ? 1 : -1
  const index = store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)
  
  let nextIndex = (index + offset) % store.patterns.length
  if (nextIndex < 0) nextIndex = store.patterns.length - 1

  setStore("selection", "patternId", store.patterns[nextIndex].id)
}

const setInstrument = (i: number, j: number, instrument: StoreSetter<Instrument | Inactive, [number, number, "instruments"]> ) => 
  setStore("instruments", i, j, instrument)

const toggleTrackMode = () => {
  setStore("trackMode", (trackMode) => trackMode === "macro" ? "micro" : "macro");
  if(store.trackMode === "macro"){
    setStore("clockOffset", store.clock);
  }
}

const getPatternIndex = (patternId: string) => store.patterns.findIndex(pattern =>pattern.id === patternId)
const getPatternColor = (patternId: string) =>  store.patterns.find(pattern =>pattern.id === patternId)?.color || ""

const getBlockIndex = (blockId: string) => store.composition.findIndex(block => block.id === blockId) 



function playSampler(buffer: AudioBuffer, selection: {start: number, end: number}, track: number, frequency: number) {
  if(!store.context) return;
  // const source = store.tracks[track].source
  if(store.tracks[track].source){
    // console.log(source.track, "track")
    store.tracks[track].source!.stop();
  }
  const source = store.context.createBufferSource();
  source.buffer = buffer;
  source.track = track;

  /* const fxChain = store.tracks[track].fxChain;
  const fxEntry = fxChain[fxChain.length - 1];
  if(fxEntry)
    source.connect(fxEntry.node); */

    source.connect(store.context.destination)

/*   if(track === 0){
    console.log('this', window.ps0 === window.ps1)
    source.connect(window.ps0)
  }else{
    console.log('that')
    source.connect(window.ps1)
  } */

  setStore("tracks", track, "source", source);

  const duration = ((selection.end - selection.start) * 128) / buffer.length * buffer.duration;
  const start = (selection.start * 128) / buffer.length * buffer.duration;
  source.start(0, start, duration);

  const midi = ftom(frequency);
  const semitones = midi - ftom(ROOT_FREQUENCY);

  console.log(track, store.tracks[0].pitchshifter === store.tracks[1].pitchshifter);
  const fxData = store.tracks[track].fxChain.find(fx => fx.name === "pitchshifter");
  const shift = fxData!.parameters.find(parameter =>parameter.label === "shift");
  const value = semitones + shift!.value;

  setStore("tracks", track, "pitch", semitones);
  store.tracks[track].pitchshifter.setParamValue("/Pitch_Shifter/shift", value)

/*   if(track === 0){
    // source.connect(window.ps0)
    window.ps0.setParamValue("/Pitch_Shifter/shift", value)
  }else{
    // source.connect(window.ps1)
    window.ps1.setParamValue("/Pitch_Shifter/shift", value)
  } */
}

const playNote = (indices: Indices, frequency: number, track: number) => {
  const instrument = store.instruments[indices[0]][indices[1]]
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
        playSampler(instrument.audioBuffer, instrument.selection, track, frequency)
      }
      break;
  }
}

const renderAudio = () => {
  let pattern;
  if(store.trackMode === "macro"){
    const totalLength = store.composition.length * SEQUENCE_LENGTH;
    const macroClock = (store.clock - store.clockOffset);
    const index = Math.floor(macroClock / SEQUENCE_LENGTH);
    if(macroClock/totalLength > 1) setStore("clockOffset", store.clock);

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
      const key = note.instrumentIndices.join("_");
      playNote(note.instrumentIndices, note.frequency, note.track)

      /* if(!activeInstruments[key])
        activeInstruments[key] = [note]
      else
        activeInstruments[key].push(note);  */     
    }
  })
/*   Object.values(activeInstruments).forEach(notes => {
    const index = Math.floor(Math.random() * notes.length)
    playNote(notes[index].instrumentIndices, notes[index].frequency, notes[index].track)
  }) */
}

const actions = {
  initFaust, initContext, initKeyboard, initTracks,
  getSelectedInstrument, setSelectedInstrumentIndices, 
  setInstrument, getColorInstrument, initInstruments,
  toggleTypeSelectedInstrument, 
  setSamplerNavigation, setSamplerSelection, 
  setSamplerWaveform, setSamplerAudioBuffer,
  createFaustNode, 
  playNote, 
  toggleTrackMode, 
  getSelectedPattern, clearSelectedPattern, copySelectedPattern, incrementSelectedPattern, 
  getPatternIndex, getPatternColor,
  getBlockIndex,
  renderAudio

}


export {store, setStore, actions}
