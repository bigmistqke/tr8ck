import { createSignal, For } from "solid-js"
import { actions, store } from "../../Store"
import { AddButton, Bar, Block, Button } from "../UIElements"
import Fx from "./Fx"
import s from "./FxPool.module.css"

export default () => {


  const compile = async (id: string, code: string) => {
    const result = await actions.compileFaust(code);
    if(result.success) actions.updateFaustFactory(id, result.dsp);
    return result;
  }

  return (
    <Block class="flex flex-col flex-1 gap-2 bg-neutral-100 p-2 overflow-hidden">
      <div class="grid grid-cols-8 flex-0 gap-2 flex-wrap justify-start">
        <Bar class="bg-white flex-1 col-span-4">FX</Bar>
        <Button 
            class="bg-white flex-1 col-span-3"
            onclick={actions.initExtraFx}
        >EXTRA FX</Button>
        <AddButton onclick={actions.addFx}/>
      </div>
      <Block class="flex-1 bg-white overflow-auto">
        <div class="flex flex-1 flex-wrap content-baseline m-2 gap-2">
          <For each={store.faustFactories}>
            {
              (fx) => {
                
                return (
                <div 
                  class={`relative cursor-move max-w-full ${s.fx}`}
                  oncontextmenu={(e) => {
                    actions.openContextMenu({
                      e,
                      options: [
                        {title: "delete", callback: () => console.log("delete") },
                        {title: "duplicate", callback: () => console.log("delete") },
                        {title: "edit", callback: () => {
                            actions.addToEditors({
                              id: fx.id,
                              code: () => fx.node.codes.dsp.code, 
                              compile: (code) => compile(fx.id, code)
                            })
                          }
                        },
                      ]
                    })
                  }}
                >
{/*                   <button 
                    class={`absolute right-1 top-1 z-10 p-1 text-xs bg-white rounded-lg drop-shadow-sm hover:bg-neutral-900 hover:text-white`}
                    onclick={() => actions.addToEditors({
                      id: fx.id,
                      code: fx.node.codes.dsp.code, 
                      compile: (code) => compile(fx.id, code)
                    })}
                    
                  >
                    edit
                  </button> */}
                  <Fx 
                    state={fx} 
                    disableOnOff={true} 
                    draggable={true}
                    factory={true}
                  /> 
                    
                </div>
              )}
            }
          </For>
        </div>
      </Block>
    </Block>
  )
}