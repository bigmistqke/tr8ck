import Faust2WebAudio, { Faust } from "faust2webaudio"
import { createStore, produce, StoreSetter } from "solid-js/store"
import { SEQUENCE_AMOUNT, SEQUENCE_LENGTH, INSTRUMENT_AMOUNT, DEFAULT_CODE, PITCHSHIFTER, ROOT_FREQUENCY } from "./constants"
import { Indices, Note, Instrument, Inactive, Pattern, Waveform, Sampler } from "./types"
import randomColor from "randomColor";
import zeptoid from "zeptoid";
import getLocalPosition from "./helpers/getLocalPosition";
import Instrument from "./components/instruments/Instrument";
import Instrument from "./components/instruments/Instrument";
import Instrument from "./components/instruments/Instrument";
import mtof from "./helpers/mtof";
import ftom from "./helpers/ftom";

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
  tracks: AudioBufferSourceNode[]
  fx: Faust2WebAudio.FaustAudioWorkletNode[]
  composition: ({id: string, patternId: string})[]
  instruments: (Instrument)[][]
  selection: {
    frequency: number
    instrumentIndices: Indices
    patternId: string
    blockId?: string
  },
  keys: {
    shift: boolean,
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
  tracks: Array(SEQUENCE_AMOUNT).fill(undefined),
  fx: Array(SEQUENCE_AMOUNT).fill(undefined),
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
          pan: 0
        })
    )
  ),
  selection: {
    frequency: ROOT_FREQUENCY,
    instrumentIndices: [0,0],
    patternId: "first",
    blockId: undefined
  },
  keys: {
    shift: false
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
        setStore("keys", "shift", true);
      case "ShiftRight":
        setStore("keys", "shift", true);
    }
  }
  window.onkeyup = (e) => {
    switch(e.code){
      case "ShiftLeft":
        setStore("keys", "shift", false);
      case "ShiftRight":
        setStore("keys", "shift", false);
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



const initTracks = async () => {
  console.log("initTracks");
  const pitchshifters = await Promise.all(
    store.tracks.map(async (track, i) => await createFaustNode(PITCHSHIFTER))
  )
  pitchshifters.forEach((pitchshifter, index) => {
    if(!store.context || !pitchshifter) return;
    pitchshifter.connect(store.context.destination)
    setStore("fx", index, pitchshifter)
  })
}

const initInstruments = async () => {
  for(let i = 0; i < INSTRUMENT_AMOUNT; i++){
    for(let j = 0; j < INSTRUMENT_AMOUNT; j++){
      const node = await createFaustNode(DEFAULT_CODE)
      if(!node) return

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
        color: randomColor()
      })

/*       setStore("instruments", i, j, {
        active: true,
        type: "synth",
        code: DEFAULT_CODE,
        node: undefined,
        color: randomColor()
      }) */
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
  console.log(track);
  if(store.tracks[track]){
    store.tracks[track].stop();
  }
  var source = store.context.createBufferSource();
  source.buffer = buffer;
  // source.connect(store.context.destination);
  if(store.fx[track])
    source.connect(store.fx[track]);

  console.log(store.fx[track]); 

  setStore("tracks", track, source);

  const duration = ((selection.end - selection.start) * 128) / buffer.length * buffer.duration;
  const start = (selection.start * 128) / buffer.length * buffer.duration;
  source.start(0, start, duration);

  const midi = ftom(frequency);
  const semitones = midi - ftom(ROOT_FREQUENCY);

  store.fx[track].setParamValue("/Pitch_Shifter/shift__semitones_", semitones)

  // source.playbackRate.value = frequency / 554
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
