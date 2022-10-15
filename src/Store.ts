import Faust2WebAudio, { Faust } from "faust2webaudio"
import { createStore, produce, StoreSetter } from "solid-js/store"
import { SEQUENCE_AMOUNT, SEQUENCE_LENGTH, INSTRUMENT_AMOUNT, DEFAULT_CODE } from "./constants"
import { Indices, Note, Instrument, Inactive, Pattern } from "./types"
import randomColor from "randomColor";
import zeptoid from "zeptoid";
import getLocalPosition from "./helpers/getLocalPosition";

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
  bpm: 160,
  patterns: [initPattern()],
  composition: [],
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
    frequency: 554,
    instrumentIndices: [0,0],
    patternId: "first",
    blockId: undefined
  },
  keys: {
    shift: false
  }
})

const getNode = async (code: string) : Promise<Faust2WebAudio.FaustAudioWorkletNode | undefined>=> {
  if(!store.faust || !store.context) return undefined
  return await store.faust.getNode(code, {
    audioCtx: store.context,
    useWorklet: true,
    // voices: 2,
    args: { "-I": "libraries/" },
  })
}

const setSelectedInstrumentIndices = (i: number, j: number) => setStore("selection", "instrumentIndices", [i, j])
const getSelectedInstrument = () => store.instruments[store.selection.instrumentIndices[0]][store.selection.instrumentIndices[1]]

const initInstruments = async (destination: AudioDestinationNode) => {
  for(let i = 0; i < INSTRUMENT_AMOUNT; i++){
    for(let j = 0; j < INSTRUMENT_AMOUNT; j++){
      const node = await actions.getNode(DEFAULT_CODE)
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

const setNavigationSampler = (type: "start" | "end", value: ((x: number) => number) | number) => {
  const [x, y] = store.selection.instrumentIndices;
  setStore("instruments", x, y, "navigation", type, value);
}

const setSelectionSampler = (type: "start" | "end", value: ((x: number) => number) | number) => {
  const [x, y] = store.selection.instrumentIndices;
  setStore("instruments", x, y, "selection", type, value);
}

const playNote = (indices: Indices, frequency: number) => {
  const instrument = store.instruments[indices[0]][indices[1]]
  if(!instrument.active) return;

  console.log(instrument.type, instrument.node);

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
      
      break;
  }
}

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

const setInstrument = (i: number, j: number, instrument: StoreSetter<Instrument | Inactive, [number, number, "instruments"]> ) => setStore("instruments", i, j, instrument)

const toggleTrackMode = () => {
  setStore("trackMode", (trackMode) => trackMode === "macro" ? "micro" : "macro");
  if(store.trackMode === "macro"){
    setStore("clockOffset", store.clock);
  }
}

const getPatternIndex = (patternId: string) => store.patterns.findIndex(pattern =>pattern.id === patternId)
const getPatternColor = (patternId: string) =>  store.patterns.find(pattern =>pattern.id === patternId)?.color || ""

const getBlockIndex = (blockId: string) => store.composition.findIndex(block => block.id === blockId) 


const render = () => {
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
  pattern.sequences.forEach(sequence => {
    const note = sequence[tick];
    if(note.active){
      const key = note.instrumentIndices.join("_");
      if(!activeInstruments[key])
        activeInstruments[key] = [note]
      else
        activeInstruments[key].push(note);      
    }
  })
  Object.values(activeInstruments).forEach(notes => {
    const index = Math.floor(Math.random() * notes.length)
    playNote(notes[index].instrumentIndices, notes[index].frequency)
  })
}

const actions = {
  getSelectedInstrument, setSelectedInstrumentIndices, 
  setInstrument, getColorInstrument, initInstruments,
  toggleTypeSelectedInstrument,
  setNavigationSampler,
  setSelectionSampler,
  getNode, 
  playNote, 
  toggleTrackMode, 
  getSelectedPattern, clearSelectedPattern, copySelectedPattern, incrementSelectedPattern, 
  getPatternIndex, getPatternColor,
  getBlockIndex,
  render

}


export {store, setStore, actions}
