import Faust2WebAudio, { Faust } from "faust2webaudio"
import { createStore, produce, StoreSetter } from "solid-js/store"
import { SEQUENCE_AMOUNT, SEQUENCE_LENGTH, INSTRUMENT_AMOUNT } from "./constants"
import { Indices, Note, Instrument, Inactive } from "./types"




const initSequence = () : Note[] => 
  Array(SEQUENCE_LENGTH)
    .fill(0)
    .map(() => ({
      active: false
    }))

const initPattern = () : Note[][] => Array(SEQUENCE_AMOUNT)
  .fill(0)
  .map(initSequence)

const [store, setStore] = createStore<{
  clock: number
  faust?: Faust
  context?: AudioContext
  selectedFrequency: number
  selectedInstrumentIndices: Indices
  selectedPattern: number
  trackMode: "micro" | "macro"
  patterns: Note[][][]
  instruments: (Instrument | Inactive)[][]
}>({
  clock: -1,
  faust: undefined,
  context: undefined,
  selectedFrequency: 554,
  selectedInstrumentIndices: [0,0],
  selectedPattern: 0,
  trackMode: "micro",
  patterns: [initPattern()],
  instruments: Array(INSTRUMENT_AMOUNT)
    .fill(0)
    .map(() =>
      Array(INSTRUMENT_AMOUNT)
        .fill(0)
        .map(() => ({active: false})
    )
  ),
})

const getNode = async (code: string) : Promise<Faust2WebAudio.FaustScriptProcessorNode | undefined>=> {
  if(!store.faust || !store.context) return undefined
  return await store.faust.getNode(code, {
    audioCtx: store.context,
    useWorklet: false,
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
    instrument.node!.setParamValue("/FaustDSP/drop", store.clock)
  }
}

const getHueInstrument = (indices: Indices) => {
  const instrument = store.instruments[indices[0]][indices[1]];
  if(instrument.active){
    return instrument.hue;
  }
  return 0
} 

const getSelectedPattern = () => store.patterns[store.selectedPattern]
const clearSelectedPattern = () => setStore("patterns", store.selectedPattern, initPattern())
const copySelectedPattern = () => {
  const clonedPattern = JSON.parse(JSON.stringify(store.patterns[store.selectedPattern]))


  setStore("patterns", produce((patterns: Note[][][]) => patterns.splice(store.selectedPattern, 0, clonedPattern)))


  setStore("selectedPattern", store.selectedPattern + 1)
}
const incrementSelectedPattern = (e: MouseEvent) => {
  const target = e.target as HTMLButtonElement;

  var rect = target.getBoundingClientRect();
  var x = e.clientX - rect.left; 
  const offset = x > rect.width/2 ? 1 : -1

  let nextSelectedPattern = (store.selectedPattern + offset) % store.patterns.length
  if (nextSelectedPattern < 0) nextSelectedPattern = store.patterns.length - 1

  setStore("selectedPattern", nextSelectedPattern)
}

const setInstrument = (i: number, j: number, instrument: StoreSetter<Instrument | Inactive, [number, number, "instruments"]> ) => setStore("instruments", i, j, instrument)

const toggleTrackMode = () => setStore("trackMode", (trackMode) => trackMode === "macro" ? "micro" : "macro")

const actions = {
  getSelectedInstrument, getNode, getHueInstrument, playNote, 
  getSelectedPattern, setInstrument, toggleTrackMode, clearSelectedPattern,
  copySelectedPattern, incrementSelectedPattern
}

export {store, setStore, actions}
