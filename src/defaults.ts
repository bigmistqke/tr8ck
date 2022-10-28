import { store } from "./Store";
import { Note, Pattern, Sampler, Synth } from "./types";
import {
  getHex
} from "pastel-color";
import { SEQUENCE_LENGTH, TRACK_AMOUNT } from "./constants";

export const defaultSampler = (index: number, tracksLength: number) : Sampler => ({
  active: true,
  index,
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
  arrayBufferName: undefined,
  color: getHex(),
  fxChains: new Array(tracksLength).fill(0).map(() => []),
  nothings: [],
  speed: 1,
  inverted: false,
  compilingIds: [],
  pan: 0
})

export const defaultSynth = (index: number) : Synth => ({
  active: true,
  index: index,
  type: "synth",
  code: "",
  elements: [],
  color: getHex(),
  pan: 0,
  fxChains: [[]],
  speed: 1,
  compilingIds: [],
  nothings: [],
})

export const defaultSequence = () : Note[] => 
  Array(SEQUENCE_LENGTH)
    .fill(0)
    .map(() => ({
      type: "inactive"
    }))

export const defaultSequences = () => 
  Array(TRACK_AMOUNT)
    .fill(0)
    .map(defaultSequence)

export const defaultPattern = (id: string) : Pattern => ({
  id,
  color: getHex(),
  sequences: defaultSequences()
})