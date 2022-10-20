import { FaustAudioWorkletNode } from "faust2webaudio"
import { createEffect, createSignal, For, onMount, Show } from "solid-js"
import { actions, store } from "../../Store"
import { FaustFactory, FxNode } from "../../types"
import { Block } from "../UIElements"
import FxParameter from "./FxParameter"
import zeptoid from 'zeptoid';
import s from "./Fx.module.css";
import { createStore } from "solid-js/store"

export default (props: {
  state: (FxNode | FaustFactory)
  class?: string, 
  index?: number,
  updateOrder: (id1: string, id2: string) => void 
  resetDragCount: () => void
}) => {
  const [_, setState] = createStore(props.state)
  const [mounted, setMounted] = createSignal(false);

  onMount(() => setTimeout(() => setMounted(true), 0))

  const dragstart = () => {
    if("resetDragCount" in props)
      props.resetDragCount();
    // "active" in props.state to check if it is an FaustNode or a FaustFactory
    const id = "active" in props.state ? props.state.id : zeptoid();
    actions.setDragging("fx", {
      id, 
      name: props.state.name, 
      detachable: "detachable" in props.state ? props.state.detachable : true,
      parameters: props.state.parameters,
      active: "active" in props.state ? props.state.active : true
    })
  }

  const dragend = () => {
    actions.setDragging("fx", undefined)
  }

  const dragover = (e: DragEvent) => {
    if(!store.dragging.fx) return;
    const targetId = (e.target as HTMLElement).id;
    const draggingId = store.dragging.fx.id;

    if(targetId === draggingId) return;

    if(e.offsetX > (e.target as HTMLElement).offsetWidth / 2){
      props.updateOrder(targetId, draggingId)
    }else{
      props.updateOrder(draggingId, targetId)
    }
  }

  const getOpacity = () => {
    // if(!mounted()) return "opacity-0";
    if("active" in props.state && !props.state.active ) return "opacity-50"
    return ""
  }

  return (
    <Block 
      class={`relative inline-flex flex-col p-1 h-full text-center bg-neutral-200 rounded-lg transition-opacity duration-250 ${
        props.class
      } ${
        getOpacity()
      }`} 
      draggable={true}
      ondragstart={dragstart}
      ondragend={dragend}
      ondragover={"node" in props.state ? dragover : undefined}
      id={props.state.id}
      ondblclick={() => setState("active", (bool) => !bool)}
    >
      <div class={`flex flex-col flex-1 ${store.dragging.fx ? "pointer-events-none" : ""}`}> 
        <div class="flex">
          <Show when={"node" in props.state}>
            <button 
              class={`flex-0 left-2 top-2 bg-white w-4 h-2 rounded-xl cursor-pointer ${
                s.button
              } ${
                (props.state as FxNode).active ? "" : s.inactive
              }`}
              onclick={() => setState("active", (bool) => !bool)}
            >
              <div class="w-2 h-2 rounded-xl bg-black"/>
            </button>
          </Show>
          
          <span class="flex-1 select-none cursor-move text-neutral-500" style={{"font-size": "8pt", "margin-bottom": "1px"}}>{props.state.name}</span>
          <Show when={"active" in props.state}>
              <div class="w-2"/>
          </Show>
        </div>
        <div class={`flex flex-1 gap-4 pl-2 pr-2`}>
          <For each={props.state.parameters}>
            {
              (parameter) => 
                <FxParameter 
                  parameter={parameter} 
                  node={"node" in props.state ? props.state.node : undefined}
                />
            }

          </For>
        </div>
      </div>
    </Block>
  )
}