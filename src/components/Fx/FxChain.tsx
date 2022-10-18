import { createEffect, For, Match, Show, Switch } from "solid-js"
import { actions, store } from "../../Store"
import Fx from "./Fx"
import { Block, CenteredLabel } from "../UI_elements"
import { Fx as FxType } from "../../types"
import { createStore } from "solid-js/store"

export default (props: {
  fxChain: FxType[]
  class?: string
  addToFxChain: (fx: FxType) => void
}) => {
  const [fxChain, setFxChain] = createStore<FxType[]>(props.fxChain);
  
  console.log('fxChain', props.addToFxChain);

  const drop = (e) => {
    e.preventDefault();
  }

  let draggingId: string;

  const dragover = async (e:DragEvent) => {
    e.preventDefault()
    const draggingFx = store.dragging.fx
    if(draggingFx === undefined) return;

    const {name, id} = draggingFx;

    if(
      (
        !draggingId 
        || draggingId !== id  
      )
      && !fxChain.find(fx => fx.id === id)
    ){
      draggingId = id;
      const fx = store.fxs.find(fx => fx.name === name);
      if(fx === undefined) return;    
      const {factory, parameters} = fx;  
      const node = await actions.createFaustNode(factory)
      if(!node) return;
      // setFxChain(fxs => [...fxs, {name, id, node, parameters}])
      /* if(!props.addToFxChain){
        console.log(props);
      }else */
        props.addToFxChain({name, id, node, parameters})
    }
    return;
  }

  createEffect(()=>{
    console.log("fxChain.length is", props.fxChain.length);
  })
  
  return (
    <Block 
      class={`relative gap-2 h-24 p-2 bg-white whitespace-nowrap overflow-x-auto overflow-y-hidden ${props.class}`}
      ondragover={dragover}
      ondrop={drop}
    >
      <Show 
        when={props.fxChain.length > 0}
        fallback={<CenteredLabel label="drag'n'drop from FX"/>}
      >
        <For each={props.fxChain}>
          {
            (fx) => <>
              <Fx 
                name={fx.name} 
                node={fx.node} 
                parameters={fx.parameters}
              />
            </>
          }
        </For>
      </Show>
      
    </Block>
  )
}
