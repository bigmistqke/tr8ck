import { store } from "./Store";
import { Note, Pattern, Sampler } from "./types";
import {
  getHex
} from "pastel-color";
import { SEQUENCE_LENGTH, TRACK_AMOUNT } from "./constants";

export const defaultSampler = (index: number = store.instruments.length) : Sampler => ({
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
  color: getHex(),
  fxChains: new Array(store.tracks.length).fill(0).map(() => []),
  nothings: [],
  speed: 1,
  inverted: false,
  compilingIds: [],
  pan: 0
})

export const defaultSequence = () : Note[] => 
  Array(SEQUENCE_LENGTH)
    .fill(0)
    .map(() => ({
      active: false
    }))

export const defaultSequences = () => 
  Array(TRACK_AMOUNT)
    .fill(0)
    .map(defaultSequence)

export const defaultPattern = () : Pattern => ({
  id: "first",
  color: getHex(),
  sequences: defaultSequences()
})