import deepClone from "deep-clone"
import { For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { store } from "../../Store"
import { FaustFactory, FxNode } from "../../types"
import { Block, CenteredLabel } from "../UIElements"
import Fx from "./Fx"

export default (props: {
  fxChain: FxNode[]
  class?: string
  compilingIds: string[]
  createNodeAndAddToFxChain: (
    fx: {
      factory: FaustFactory
      id: string
      parameters: any[] | undefined
    }, 
    index: number
  ) => void
  removeNodeFromFxChain: (id: string) => void
  updateOrder: (index1: number, index2: number) => void
}) => {  
  let container : HTMLDivElement;

  const [_, setFxChain] = createStore(props.fxChain);


  const drop = (e: DragEvent) => {
    dragCount = 0;
    e.preventDefault();
  }

  let dragCount = 0;

  const dragenter = (e: DragEvent) => {
    // if(e.target.id === store.dragging.fx?.id) return;
    dragCount++
  }

  const dragover = async (e:DragEvent) => {
    e.preventDefault()

    const draggingFx = store.dragging.fx
    if(draggingFx === undefined) return;
    const {name, id, parameters, active} = draggingFx;

    if(
      !props.compilingIds.includes(id)
      && !props.fxChain.find(fx => fx.id === id)
    ){
      const factory = store.faustFactories.find(fx => fx.dsp.dspMeta.name === name);
      if(factory === undefined) return;   

      const node = {factory, id, parameters: deepClone(parameters), active}

      props.createNodeAndAddToFxChain(node, props.fxChain.length - 1)
    }

    return;
  }

  const dragleave = (e: DragEvent) => {
    e.preventDefault()

    // if((e.target as HTMLElement).id === store.dragging.fx?.id) return;
    dragCount--;

    const draggingFx = store.dragging.fx

    if(draggingFx === undefined) return;
    const {name, id, detachable} = draggingFx;



    if(detachable && dragCount === 0){
      props.removeNodeFromFxChain(id)
    }
  }
  
  const updateOrder = (id1: string, id2: string) => {
    const index1 = props.fxChain.findIndex(fx => fx.id === id1);
    const index2 = props.fxChain.findIndex(fx => fx.id === id2);

    if(index1 === -1){
      // setFxChain(produce((fxs) =>ARRAY.insertBeforeElement(fxs, )))
    }else 
    if(index2 === -1){

    }else{
      if(index1 < index2) return;
      props.updateOrder(index1, index2)
      dragCount--;
    }
  }

  return (
    <Block 
      class={`relative flex gap-2 h-24 p-2 bg-white whitespace-nowrap overflow-x-auto overflow-y-hidden ${props.class}`}
      ondragover={dragover}
      ondragleave={dragleave}
      ondrop={drop}
      ondragenter={dragenter}
      ref={container!}
    >
      <Show 
        when={props.fxChain.length > 0}
        fallback={<CenteredLabel label="drag'n'drop from FX"/>}
      >
        <For each={props.fxChain}>
          {
            (fx, index) => <Fx state={fx} index={index()} updateOrder={updateOrder} resetDragCount={() => dragCount = 0}/>
          }
        </For>
      </Show>
      
    </Block>
  )
}
