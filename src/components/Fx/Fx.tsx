import { createSignal, For, Show } from "solid-js"
import { actions, store } from "../../Store"
import { FaustFactory, FaustElement } from "../../types"
import { Block } from "../UIElements"
import FxParameter from "./FxParameter"
import zeptoid from 'zeptoid';
import s from "./Fx.module.css";
import { createStore } from "solid-js/store"

const OnOffSwitch = (props: {active: boolean, onOff: () => void}) => (
  <button 
    class={`flex-0 left-2 top-2 bg-white w-4 h-2 rounded-xl cursor-pointer ${
      s.button
    } ${
      props.active ? "" : s.inactive
    }`}
    onclick={props.onOff}
  >
    <div class="w-2 h-2 rounded-xl bg-neutral-900"/>
  </button>
)

export default (props: {
  state: (FaustElement | FaustFactory)
  class?: string, 
  index?: number,
  updateOrder?: (id1: string, id2: string) => void 
  disableOnOff?: boolean
  draggable?: boolean
  factory?: boolean
}) => {
  const [_, setState] = createStore(props.state)

  const getName = () => "dspMeta" in props.state?.node ? props.state.node.dspMeta.name : props.state.initialName

  const dragstart = () => {
    if(props.draggable && !props.factory)
      setDraggable(true);

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
    setDraggable(false);
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

  const onOff = () => {
    dragend()    
    if(props.disableOnOff) return;
    if("active" in props.state) 
      setState("active", (bool: boolean) => !bool)
  }

  const [draggable, setDraggable] = createSignal(false);


  return (
    <Show when={props.state.initialName !== "input" && props.state.initialName !== "output"}>
      <Block 
        extraClass={`relative inline-flex flex-col p-1 text-center bg-neutral-200 rounded-lg transition-opacity duration-250 ${
          props.class || ""
        } ${
          getOpacity()
        }`} 
        draggable={props.factory || draggable()}
        id={props.state.id}
        ondblclick={onOff}
        ondragover={dragover}
        ondragend={props.draggable ? dragend : undefined}
        onmousedown={props.factory ? dragstart : undefined}
      >
        <div
          class={`flex flex-col flex-1 ${
            !props.disableOnOff && (props.factory || draggable() || store.dragging.fx) ? "pointer-events-none" : ""
          }`}
        > 
          <div 
            class={`flex ${
              props.draggable ? "cursor-move" : ""
            }`} 
            onmousedown={props.draggable ? dragstart : undefined}
          >
            <Show when={!props.disableOnOff}>
              <OnOffSwitch onOff={onOff} active={ "active" in props.state ? props.state.active : true}/>
            </Show>
            <span 
              class="flex-1 select-none text-neutral-500 pr-2 pl-2 uppercase" 
              style={{"font-size": "8pt", "margin-bottom": "1px"}}
            >
              { getName() } 
            </span>
            <Show when={"active" in props.state}>
                <div class="w-2"/>
            </Show>
          </div>
          <div 
            class={`flex flex-1 ${
              props.factory ? "flex-wrap" : ""
            } justify-center gap-4 pl-2 pr-2`}
          >
            <For each={props.state.parameters}>
              {
                (parameter) => 
                  <FxParameter 
                    parameter={parameter} 
                    node={"factoryId" in props.state ? props.state.node : undefined}
                  />
              }

            </For>
          </div>
        </div>
      </Block>
    </Show>
  )
}