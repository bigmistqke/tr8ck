import { For } from "solid-js"
import { actions, store } from "../../Store"
import { Bar, Block } from "../UI_elements"
import Fx from "./Fx"
import zeptoid from 'zeptoid';

export default () => {
  const dragstart = (name: string) => {
    const id = zeptoid();
    actions.setDragging("fx", {id, name})
  }

  const dragend = () => {
    actions.setDragging("fx", undefined)
  }
    
  return (
    <Block class="flex flex-1 flex-col gap-2 bg-neutral-100 p-2 overflow-hidden">
      <Bar class="bg-white flex-0 h-10">FX</Bar>
      <Block class="flex flex-col flex-1 gap-2 bg-white overflow-auto">
        <For each={store.fxs}>
          {
            (fx) => (
              <div 
                class="h-20 cursor-move" 
                draggable={true} 
                data-fx={fx.name}
                ondragstart={() => dragstart(fx.name)}
                ondragend={dragend}
              >
                <Fx name={fx.name} parameters={fx.parameters} class="pointer-events-none"/> 
              </div>
            )
          }
        </For>
      </Block>
    </Block>
      
  )
}