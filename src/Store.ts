import Faust2WebAudio, { Faust, FaustAudioWorkletNode } from "faust2webaudio"
import { createStore, produce, StoreSetter } from "solid-js/store"
import { SEQUENCE_AMOUNT, SEQUENCE_LENGTH, INSTRUMENT_AMOUNT, PITCHSHIFTER, ROOT_FREQUENCY, REVERB } from "./constants"
import { Indices, Note, Pattern, Waveform, Instrument, Sampler, Track, FxFactory, Fx } from "./types"
import randomColor from "randomColor";
import zeptoid from "zeptoid";
import getLocalPosition from "./helpers/getLocalPosition";
import ftom from "./helpers/ftom";
import collectParameters from "./faust/collectParameters";
import { batch } from "solid-js";
import bpmToMs from "./helpers/bpmToMs";
import cloneAudioBuffer from "./helpers/cloneAudioBuffer";
import audioBufferToWaveform from "./waveform/audioBufferToWaveform";
import { TCompiledDsp } from "faust2webaudio/src/types";

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
  tracks: Track[]
  composition: ({id: string, patternId: string})[]
  instruments: (Instrument)[][]
  selection: {
    frequency: number
    instrumentIndices: Indices
    patternId: string
    blockId?: string
    trackIndex: number
  },
  keys: {
    shift: boolean,
    control: boolean
  }
  fxs: FxFactory[],
  dragging: {
    fx: {
      id: string
      name: string
    } | undefined
  }
}>({
  clock: -1,
  faust: undefined,
  context: new window.AudioContext(),
  trackMode: "micro",
  clockOffset: 0,
  bpm: 120,
  patterns: [initPattern()],
  composition: [],
  tracks: Array(SEQUENCE_AMOUNT).fill(0).map(()=>({
    instrument: undefined,
    semitones: 0,
    frequency: 0,
    fxChain: []
  })),
  instruments: Array(INSTRUMENT_AMOUNT[0])
    .fill(0)
    .map(() =>
      Array(INSTRUMENT_AMOUNT[1])
        .fill(0)
        .map(() => 
          ({
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
    trackIndex: 0
  },
  keys: {
    shift: false,
    control: false
  },
  fxs: [],
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

const compileFaust = async (code: string, name: string) =>  {

  const compiledDsp = await store.faust?.compileCodes(code, ["-I", "libraries/"], true);

  if(!compiledDsp) return;

  const fx = {
    factory: compiledDsp,
    name,
    parameters: collectParameters(compiledDsp)
  }

  

  setStore("fxs", (fxs) => [...fxs, Object.setPrototypeOf(fx, {})])

  return compiledDsp;
}

const createFaustNode = async (compiledDsp: TCompiledDsp) : Promise<Faust2WebAudio.FaustAudioWorkletNode | undefined>=> {
  if(!store.faust || !store.context) return undefined
  const optionsIn = { compiledDsp, audioCtx: store.context, args: { "-I": "libraries/" }};

  console.log("compiledDSP is", compiledDsp);

  const node = await store.faust.getAudioWorkletNode(optionsIn);
  return node;
}

const setSelectedInstrumentIndices = (i: number, j: number) => setStore("selection", "instrumentIndices", [i, j])
const getSelectedInstrument = () => store.instruments[store.selection.instrumentIndices[0]][store.selection.instrumentIndices[1]]
const addToFxChainInstrument = (fx: StoreSetter<Fx[], ["fxChain", number, number, "instruments"]>) => {
  setSelectedInstrument("fxChain", (fxs: Fx[]) => [...fxs, fx])
}

const initFx = async () => {
  await Promise.all([
    compileFaust(REVERB, "reverb"),
    compileFaust(PITCHSHIFTER, "pitchshifter")
  ])
}

const initTracks = async () => {
  console.log("initTracks");
  const compiledPitchshifter = store.fxs.find(fx => fx.name === "pitchshifter");
  if(!compiledPitchshifter) return;

  store.tracks.forEach(async (_, index) => {
    const pitchshifter = await createFaustNode(compiledPitchshifter.factory);

    console.log("pitchshifter is", pitchshifter)
    if(!store.context || !pitchshifter) return;

    const ps = {
      id: zeptoid(),
      name: "pitchshifter", 
      node: pitchshifter, 
      parameters: compiledPitchshifter.parameters
    }

    pitchshifter.connect(store.context.destination)
    setStore("tracks", index, "fxChain", [ps]);
    console.log(store.tracks[index].fxChain)
    setStore("tracks", index, "pitchshifter", pitchshifter);
  })
}

const initInstruments = async () => {
  if(!store.context) return;
  for(let i = 0; i < INSTRUMENT_AMOUNT[0]; i++){
    for(let j = 0; j < INSTRUMENT_AMOUNT[1]; j++){
/*       const node = await createFaustNode(DEFAULT_CODE)
      if(!node) return */

/*       const reverbFactory = await compileFaust(REVERB) as TCompiledDsp;
      const reverbNode = await createFaustNode(reverbFactory) as FaustAudioWorkletNode;
      const fx = {
        name: "reverb",
        parameters: collectParameters(reverbNode),
        node: reverbNode
      }
 */
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
        fxChain: [/* fx */],
        speed: 1,
        inverted: false
      })

      console.log()
    }
  }
}




const setBPM = (bpm: StoreSetter<number, ["bpm"]>, offset: number) => {
  batch(()=>{
    setStore("bpm", bpm)
    const clockOffset = (store.clock) * bpmToMs(store.bpm)

    // console.log(offset, getClock(offset, store.bpm),)

    setStore("clockOffset", performance.now() - clockOffset);
  })

} 

const toggleTypeSelectedInstrument = () => {
  const instrument = getSelectedInstrument()
  if(!instrument.active) return;
  const [i, j] = store.selection.instrumentIndices
  const instrumentType = instrument.type === "synth" ? "sampler" : "synth"
  setStore("instruments", i, j, "type", instrumentType)
}

const setInstrument = (i: number, j: number, instrument: StoreSetter<Instrument, [number, number, "instruments"]> ) => 
  setStore("instruments", i, j, instrument)

const setSelectedInstrument = function(...args: any[]){
  const [x, y] = store.selection.instrumentIndices;
  setStore("instruments", x, y, ...args)
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
  
  const clonedBuffer2 = cloneAudioBuffer(audioBuffer, store.context);
  const reversedWaveform = await audioBufferToWaveform(clonedBuffer2, store.context)
  actions.setSamplerWaveform(reversedWaveform);

  var {start, end} = selection;
  setSamplerSelection("start", waveform.length - end)
  setSamplerSelection("end", waveform.length - start)

  var {start, end} = navigation;
  setSamplerNavigation("start", end)
  setSamplerNavigation("end", start)
}

const getColorInstrument = (indices: Indices) => {
  const instrument = store.instruments[indices[0]][indices[1]];
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
  console.log("hallo")
  const clonedPattern = JSON.parse(JSON.stringify(store.patterns[getSelectedPatternIndex()]))
  clonedPattern.id = zeptoid()
  clonedPattern.color = randomColor();
  console.log(clonedPattern);
  setStore("patterns", produce((patterns: Pattern[]) => patterns.splice(getSelectedPatternIndex() + 1, 0, clonedPattern)))
  setStore("selection", "patternId", clonedPattern.id)
}

const addToFxChainTrack = (fx: Fx) => {
  setStore("tracks", store.selection.trackIndex, "fxChain", (fxs) => [...fxs, fx])
}

const setSelectedTrackIndex = (index: number) => {
  setStore("selection", "trackIndex", index);
}

const toggleTrackMode = () => {
  setStore("trackMode", (trackMode) => trackMode === "macro" ? "micro" : "macro");
  if(store.trackMode === "macro"){
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
  return fxData!.parameters.find(parameter =>parameter.label === "shift");
}

function playSampler(instrument: Sampler, track: number, frequency: number) {
  const {audioBuffer, selection, speed} = instrument;

  if(!store.context || !audioBuffer) return;
  if(store.tracks[track].source){
    store.tracks[track].source!.stop();
  }
  const source = store.context.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = speed;

  const fxChain = store.tracks[track].fxChain;
  const fxEntry = fxChain[fxChain.length - 1];
  
  source.connect(fxEntry.node || store.context.destination)

  setStore("tracks", track, "source", source);
  setStore("tracks", track, "instrument", instrument);

  const duration = ((selection.end - selection.start) * 128  ) / audioBuffer.length * (audioBuffer.duration ) ;
  const start = (selection.start * 128) / audioBuffer.length * audioBuffer.duration;
  source.start(0, start, duration);

  const semitones = getTrackSemitones(frequency, Math.abs(speed))
  const shift = getTrackShift(track);
  const totalPitch = semitones + shift!.value;


  setStore("tracks", track, "semitones", semitones);
  setStore("tracks", track, "frequency", frequency);

  store.tracks[track].pitchshifter?.setParamValue("/Pitch_Shifter/shift", totalPitch)
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
        playSampler(instrument, track, frequency)
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

const setDragging = (type: "fx", data: any) => setStore("dragging", type, data)

const actions = {
  initFaust, initKeyboard, initTracks, initFx,
  setBPM,
  getSelectedInstrument, setSelectedInstrumentIndices, 
  setInstrument, getColorInstrument, initInstruments,
  addToFxChainInstrument,
  toggleTypeSelectedInstrument, 
  setSamplerNavigation, setSamplerSelection, 
  setSamplerWaveform, setSamplerAudioBuffer,
  setSamplerSpeed, revertSamplerAudiobuffer,
  createFaustNode, 
  playNote, 
  toggleTrackMode, 
  setSelectedTrackIndex,
  addToFxChainTrack,
  setSelectedPatternId, incrementSelectedPatternId, getSelectedPattern, clearSelectedPattern, copySelectedPattern, 
  getPatternIndex, getPatternColor,
  getBlockIndex,
  renderAudio,
  setDragging
}


export {store, setStore, actions}
