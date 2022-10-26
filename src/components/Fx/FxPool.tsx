import { For } from "solid-js"
import { actions, store } from "../../Store"
import { AddButton, Bar, Block } from "../UIElements"
import Fx from "./Fx"
import s from "./FxEditor.module.css"

export default () => {
  return (
    <Block class="flex flex-col flex-1 gap-2 bg-neutral-100 p-2 overflow-hidden">
      <div class="grid grid-cols-8 flex-0 gap-2 flex-wrap justify-start">
        <Bar class="bg-white flex-1 h-10 col-span-7">FX</Bar>
        <AddButton onclick={actions.addFx}/>
      </div>
      <Block class="flex-1 bg-white overflow-auto">
        <div class="flex flex-1 flex-wrap content-baseline m-2 gap-2">
          <For each={store.faustFactories}>
            {
              (fx) => {
                
                return (
                <div 
                  class={`relative h-20 cursor-move ${s.fx}`} 
                >
                  <button 
                    class={`absolute right-1 top-1 z-10 p-1 text-xs bg-white rounded-lg drop-shadow-sm hover:bg-black hover:text-white`}
                    onclick={() => actions.addToEditors({
                      id: fx.id,
                      code: fx.node.codes.dsp.code, 
                      oncompile: (dsp) => actions.updateFaustFactory(fx.id, dsp)
                    })}
                  >
                    edit
                  </button>
                  <Fx state={fx}/> 
                </div>
              )}
            }
          </For>
        </div>
      </Block>
    </Block>
  )
}