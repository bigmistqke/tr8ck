import { Match, Switch } from "solid-js"
import SamplerUI from "./SamplerUI"
import SynthUI from "./SynthUI"
import { Instrument, Indices, Sampler, Synth } from "../types"
import { actions } from "../Store"

const InstrumentUI = () => () =>
        {
            const instrument = actions.getSelectedInstrument();
            if(!instrument.active) return;
            return <Switch fallback={<>error type of instrument is undefined</>}>
                <Match when={instrument.type === "sampler"}>
                    <SamplerUI instrument={actions.getSelectedInstrument() as Sampler}/>
                </Match>
                <Match when={instrument.type === "synth"}>
                    <SynthUI 
                        instrument={instrument as Synth} 
                    />
                </Match>
            </Switch>
        }
    
  

  export default InstrumentUI