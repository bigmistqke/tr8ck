import deepClone from "deep-clone"
import { For, Show } from "solid-js"
import { store } from "../../Store"
import { FaustElement, FaustFactory } from "../../types"
import { Block, CenteredLabel } from "../UIElements"
import Fx from "./Fx"

export default (props: {
  fxChain: (FaustFactory | FaustElement)[]
  class?: string
  compilingIds: string[]
  createNodeAndAddToFxChain: (
    fx: {
      factory: FaustFactory
      id: string
      parameters: any[] | undefined
      active: boolean
    }, 
    index: number
  ) => void
  removeNodeFromFxChain: (id: string) => void
  updateOrder: (index1: number, index2: number) => void
}) => {  
  let container : HTMLDivElement;

  const drop = (e: DragEvent) => e.preventDefault()

  const dragover = async (e:DragEvent) => {
    e.preventDefault()

    const draggingFx = store.dragging.fx
    
    if(draggingFx === undefined) return;
    
    const {name, id, parameters, active} = draggingFx;

    if(
      !props.compilingIds.includes(id)
      && !props.fxChain.find(fx => fx.id === id)
    ){
      const factory = store.faustFactories.find(fx => fx.initialName === name);
      if(factory === undefined) return;   

      const node = {factory, id, parameters: deepClone(parameters), active}

      props.createNodeAndAddToFxChain(node, props.fxChain.length - 1)
    }

    return;
  }

  const dragleave = (e: DragEvent) => {
    e.preventDefault()

    if(!store.dragging.fx) return;
    if ((e.currentTarget as HTMLElement).contains((e.relatedTarget as Node))) {return;}

    const {id, detachable} = store.dragging.fx;

    if(detachable){
      props.removeNodeFromFxChain(id)
    }
  }
  
  const updateOrder = (id1: string, id2: string) => {
    const index1 = props.fxChain.findIndex(fx => fx.id === id1);
    const index2 = props.fxChain.findIndex(fx => fx.id === id2);

    if(index1 < index2) return;
    props.updateOrder(index1, index2)
  }

  return (
    <Block 
      extraClass={`relative flex gap-2 h-24 p-2 bg-white flex-nowrap whitespace-nowrap overflow-x-auto overflow-y-hidden ${props.class}`}
      ondragover={dragover}
      ondragleave={dragleave}
      ondrop={drop}
      ref={container!}
    >
      <Show 
        when={props.fxChain.length > 2}
        fallback={<CenteredLabel label="drag'n'drop from FX"/>}
      >
        <For each={props.fxChain}>
          {
            (fx, index) => 
              <Fx 
                state={fx} 
                index={index()} 
                updateOrder={updateOrder}
                draggable={true}
              />
          }
        </For>
      </Show>
    </Block>
  )
}
