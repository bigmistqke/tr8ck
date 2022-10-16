import { createEffect, Match, Switch } from "solid-js"
import SamplerUI from "./Sampler"
import SynthUI from "./Synth"
import { Sampler, Synth } from "../../types"
import { actions, store } from "../../Store"
import InstrumentSelection from "./InstrumentSelection"
import { Button } from "../UI_elements"

export type Instrument = Sampler | Synth 


const Instrument = () => {
    const instrument = actions.getSelectedInstrument
    const indices = store.selection.instrumentIndices
    const type = () => {
        const i = actions.getSelectedInstrument();
        return i.active ? i.type : undefined
    }
    return <div class="flex flex-1 flex-col gap-4">
        <div class="flex flex-1 flex-col gap-4">
            <div class="flex  text-black text-xl gap-4">
                <div class={`flex flex-1 items-center rounded-2xl ${ instrument().active ? "bg-selected" : "" }`}>
                    <span class="flex-1 text-center">
                        {indices[0]} : {indices[1]}
                    </span>
                </div>
                <Button class="flex-1 text-center bg-white" onclick={actions.toggleTypeSelectedInstrument}>{type()?.toUpperCase()}</Button>

            </div>
            <Switch fallback={<>error type of instrument is undefined</>}>
                <Match when={type() === "sampler"}>
                    <SamplerUI/>
                </Match>
                <Match when={!type() || type() === "synth"}>
                    <SynthUI 
                        instrument={instrument() as Synth} 
                    />
                </Match>
            </Switch>
        </div>
        
        <InstrumentSelection/>
    </div>
}
  
export default Instrument