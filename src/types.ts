import Faust2WebAudio from "faust2webaudio"

interface InstrumentBase {
    active: true
    pan: number
    hue: number
}

export interface Sampler extends InstrumentBase {
    type: "sampler"
    src?: string
    start: number
    end: number
    speed: number
    node?: undefined
    error?: undefined
}
export interface Synth extends InstrumentBase {
    type: "synth",
    code: string,
    node: Faust2WebAudio.FaustScriptProcessorNode | undefined
    error?: string
}
export type Instrument = Sampler | Synth 

export type getNode = (code: string) => Promise<Faust2WebAudio.FaustScriptProcessorNode | undefined>
  
export   interface ActiveNote  {
    active: true
    frequency: number
    instrumentIndices: Indices
  }
  export interface Inactive{
    active: false
    node?: undefined
    error?: undefined
  }
  export type Note = ActiveNote | Inactive
  
  export type Indices = [number, number]