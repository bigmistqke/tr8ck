import { For } from "solid-js"
import { actions, store } from "../../Store"
import { Bar, Block } from "../UIElements"
import Fx from "./Fx"
import s from "./FxEditor.module.css"

export default () => {
  return (
    <Block class="flex flex-col flex-1 gap-2 bg-neutral-100 p-2 overflow-hidden">
      <Bar class="bg-white flex-0 h-10">FX</Bar>
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
                      code: fx.dsp.codes.dsp.code, 
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