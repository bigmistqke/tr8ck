import Faust2WebAudio, { FaustAudioWorkletNode } from "faust2webaudio"
import { TCompiledCode, TCompiledDsp } from "faust2webaudio/src/types"

interface InstrumentBase {
    active: true
    pan: number
    color: string
    fxChain: Fx[]
    speed: number
}

export interface Sampler extends InstrumentBase {
    type: "sampler"
    src?: string
    navigation: {
      start: number
      end: number
    }
    selection: {
      start: number
      end: number
    }
    speed: number
    waveform?: Waveform
    audioBuffer?: AudioBuffer
    node?: undefined
    error?: undefined
    inverted: boolean
}
export interface Synth extends InstrumentBase {
    type: "synth",
    code: string,
    node: Faust2WebAudio.FaustAudioWorkletNode | undefined
    error?: string
}
export type Instrument = Sampler | Synth 

export type createFaustNode = (code: string) => Promise<Faust2WebAudio.FaustAudioWorkletNode | undefined>
  
export   interface ActiveNote  {
  active: true
  frequency: number
  instrumentIndices: Indices
}
export interface Inactive{
  active: false
  node?: undefined
  error?: undefined
  navigation?: undefined
  selection?: undefined
}
export type Note = ActiveNote | Inactive

export interface Pattern {
  sequences: Note[][]
  id: string
  color: string
}

export type Indices = [number, number]

export interface Waveform {
  min: number[]
  max: number[]
  length: number
}

export interface Fx {
  id: string
  name: string;
  node: FaustAudioWorkletNode;
  parameters: FxParameter[];
}

export interface FxFactory {
  name: string;
  factory: TCompiledDsp;
  parameters: FxParameter[];
}

export interface FxParameter {
  address: string
  label: string
  init: number
  value: number
  max: number
  min: number
  step: number
}

export interface Track {
  source?: AudioBufferSourceNode 
  instrument?: Instrument
  frequency: number
  semitones: number
  fxChain: Fx[]
  pitchshifter?: FaustAudioWorkletNode
}