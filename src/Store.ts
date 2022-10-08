import Faust2WebAudio, { Faust } from "faust2webaudio"
import { createStore, produce, StoreSetter } from "solid-js/store"
import { SEQUENCE_AMOUNT, SEQUENCE_LENGTH, INSTRUMENT_AMOUNT } from "./constants"
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
  selectedFrequency: number
  selectedInstrumentIndices: Indices
  selectedPatternId: string
  selectedBlockId?: string
  trackMode: "micro" | "macro"
  clockOffset: number
  bpm: number
  patterns: Pattern[]
  composition: ({id: string, patternId: string})[]
  instruments: (Instrument | Inactive)[][]
}>({
  clock: -1,
  faust: undefined,
  context: undefined,
  selectedFrequency: 554,
  selectedInstrumentIndices: [0,0],
  selectedPatternId: "first",
  selectedBlockId: undefined,
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
        .map(() => ({active: false})
    )
  ),
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

const getSelectedInstrument = () => store.instruments[store.selectedInstrumentIndices[0]][store.selectedInstrumentIndices[1]]

const playNote = (indices: Indices, frequency: number) => {
  const instrument = store.instruments[indices[0]][indices[1]]
  if(!instrument.active) return;
  if(instrument.type === "synth" && instrument.node){
    instrument.node.setParamValue(
      "/FaustDSP/freq",
      frequency
    )
    instrument.node.setParamValue("/FaustDSP/drop", 0.9 + ((store.clock / 10000) % 0.1))
  }
}

const getColorInstrument = (indices: Indices) => {
  const instrument = store.instruments[indices[0]][indices[1]];
  if(instrument.active){
    return instrument.color;
  }
  return ""
} 


const getSelectedPattern = () => store.patterns.find(pattern => pattern.id === store.selectedPatternId)

const getSelectedPatternIndex = () => store.patterns.findIndex(pattern => pattern.id === store.selectedPatternId)

const clearSelectedPattern = () => setStore("patterns", getSelectedPatternIndex(), initPattern())
const copySelectedPattern = () => {
  console.log("hallo")
  const clonedPattern = JSON.parse(JSON.stringify(store.patterns[getSelectedPatternIndex()]))
  clonedPattern.id = zeptoid()
  clonedPattern.color = randomColor();
  console.log(clonedPattern);
  setStore("patterns", produce((patterns: Pattern[]) => patterns.splice(getSelectedPatternIndex() + 1, 0, clonedPattern)))
  setStore("selectedPatternId", clonedPattern.id)
}




const incrementSelectedPattern = (e: MouseEvent) => {

  const offset = getLocalPosition(e).percentage.y > 50 ? 1 : -1

  const index = store.patterns.findIndex(pattern => pattern.id === store.selectedPatternId)

  let nextIndex = (index + offset) % store.patterns.length

  if (nextIndex < 0) nextIndex = store.patterns.length - 1

  const nextId = store.patterns[nextIndex].id;

  setStore("selectedPatternId", nextId)
}

const setInstrument = (i: number, j: number, instrument: StoreSetter<Instrument | Inactive, [number, number, "instruments"]> ) => setStore("instruments", i, j, instrument)

const toggleTrackMode = () => {
  setStore("trackMode", (trackMode) => trackMode === "macro" ? "micro" : "macro");
  if(store.trackMode === "macro"){
    // store.clockOffset = store.clock;
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
      setStore("selectedBlockId", id);
      setStore("selectedPatternId", patternId);

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
  getSelectedInstrument, getColorInstrument, getNode, playNote, 
  getSelectedPattern, setInstrument, toggleTrackMode, clearSelectedPattern,
  copySelectedPattern, incrementSelectedPattern, getPatternIndex, 
  getPatternColor,
  getBlockIndex,
  render

}


export {store, setStore, actions}
