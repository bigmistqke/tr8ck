import { FaustAudioWorkletNode } from "faust2webaudio"
import { createEffect, createSignal, For, onMount, Show } from "solid-js"
import { actions, store } from "../../Store"
import { FaustFactory, FaustElement } from "../../types"
import { Block } from "../UIElements"
import FxParameter from "./FxParameter"
import zeptoid from 'zeptoid';
import s from "./Fx.module.css";
import { createStore } from "solid-js/store"

export default (props: {
  state: (FaustElement | FaustFactory)
  class?: string, 
  index?: number,
  updateOrder?: (id1: string, id2: string) => void 
  resetDragCount?: () => void
}) => {
  const [_, setState] = createStore(props.state)

  const getName = () => "dspMeta" in props.state?.node ? props.state.node.dspMeta.name : props.state.initialName

  const dragstart = () => {
    if(props.resetDragCount !== undefined)
      props.resetDragCount();
    // "active" in props.state typeguard if it is an FaustNode or a FaustFactory
    const id = "active" in props.state ? props.state.id : zeptoid();
    actions.setDragging("fx", {
      id, 
      name: props.state.initialName, 
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
    if(!props.updateOrder) return
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
    if("active" in props.state && !props.state.active ) return "opacity-50"
    return ""
  }



  const OnOffSwitch = () => (
    <Show when={"node" in props.state}>
      <button 
        class={`flex-0 left-2 top-2 bg-white w-4 h-2 rounded-xl cursor-pointer ${
          s.button
        } ${
          (props.state as FaustElement).active ? "" : s.inactive
        }`}
        onclick={() => setState("active", (bool) => !bool)}
      >
        <div class="w-2 h-2 rounded-xl bg-black"/>
      </button>
    </Show>
  )

  createEffect(() => {
    console.log("props.state.name", props.state.initialName)

  })

  createEffect(() => {
    console.log("getName()", getName())

  })

  return (
    <Show when={props.state.initialName !== "input" && props.state.initialName !== "output"}>
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
            <OnOffSwitch/>
            <span class="flex-1 select-none cursor-move text-neutral-500 pr-2 pl-2" style={{"font-size": "8pt", "margin-bottom": "1px"}}>
              {
                getName() || props.state.initialName 
              }
            </span>
            <Show when={"active" in props.state}>
                <div class="w-2"/>
            </Show>
          </div>
          <div class={`flex flex-1 justify-center gap-4 pl-2 pr-2`}>
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
    </Show>
    
  )
}