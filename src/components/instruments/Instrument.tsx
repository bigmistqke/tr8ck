import { createEffect, Match, Switch } from "solid-js"
import SamplerUI from "./Sampler/Sampler"
import SynthUI from "./Synth"
import { Sampler, Synth } from "../../types"
import { actions, store } from "../../Store"
import InstrumentSelection from "./InstrumentSelection"
import {  Bar, Block, ButtonBar } from "../UI_elements"
import FxChain from "../Fx/FxChain"

export type Instrument = Sampler | Synth 


const Instrument = () => {
    const instrument = actions.getSelectedInstrument
    const indices = store.selection.instrumentIndices
    const type = () => {
        const i = actions.getSelectedInstrument();
        return i.active ? i.type : undefined
    }
    
    return (
      <Block class="flex flex-1 bg-neutral-100 p-2 w-full">
        <div class="flex flex-1 flex-col gap-2 w-full">
            <div class="flex flex-1 flex-col gap-2">
                <div class="flex  text-black gap-2">
                    <Bar class="bg-selected select-none">{indices[0]} : {indices[1]}</Bar>
                    <Bar class="flex-1 text-center bg-white select-none">{type()?.toUpperCase()}</Bar>
                    <ButtonBar class="flex-1 text-center bg-white" onclick={actions.toggleTypeSelectedInstrument}>change</ButtonBar>
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
                <FxChain 
                  fxChain={instrument().fxChain} 
                  class="w-full overflow-hidden"
                  addToFxChain={actions.addToFxChainInstrument}
                />
                <InstrumentSelection/>
            </div>
        </div>
      </Block>
        
    )
}
  
export default Instrument