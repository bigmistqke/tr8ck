import { createEffect, Match, Switch } from "solid-js"
import SamplerUI from "./Sampler/Sampler"
import SynthUI from "./Synth/Synth"
import { Sampler, Synth } from "../../types"
import { actions, store } from "../../Store"
import InstrumentSelection from "./InstrumentSelection"
import {  Bar, Block, ButtonBar } from "../UIElements"
import FxChain from "../Fx/FxChain"

export type Instrument = Sampler | Synth 
const Instrument = () => {
    const instrument = actions.getSelectedInstrument
    const type = () => {
        const i = instrument();
        return i.active ? i.type : undefined
    }


    
    return (
      <Block class="flex flex-0 bg-neutral-100 p-2 w-full">
        <div class="flex flex-1 flex-col gap-2 w-full">
            <div class="flex flex-1 flex-col gap-2">
                <div class="flex  text-black gap-2">
                    <Bar class="bg-selected-instrument select-none">#{store.selection.instrumentIndex}</Bar>
                    <ButtonBar 
                      class="flex-1 text-center bg-white select-none"
                      selected={actions.getSelectedInstrument().type === "sampler"}
                      onClick={() => actions.setTypeSelectedInstrument("sampler")}
                    >Sampler</ButtonBar>
                    <ButtonBar 
                      class="flex-1 text-center bg-white" 
                      onClick={() => actions.setTypeSelectedInstrument("synth")}
                      selected={actions.getSelectedInstrument().type === "synth"}
                    >Synth</ButtonBar>
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
                  fxChain={instrument().fxChains[0]} 
                  class="w-full overflow-hidden"
                  createNodeAndAddToFxChain={actions.createNodeAndAddToFxChainInstrument}
                  removeNodeFromFxChain={actions.removeNodeFromFxChainInstrument}
                  compilingIds={instrument().compilingIds}
                  updateOrder={actions.updateOrderFxChainInstrument}
                />
                <InstrumentSelection/>
            </div>
        </div>
      </Block>
        
    )
}
  
export default Instrument