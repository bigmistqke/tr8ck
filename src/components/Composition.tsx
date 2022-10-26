import {  createSignal, For, onMount } from "solid-js"
import { produce } from "solid-js/store"
import { actions, setStore, store } from "../Store"
import { Bar, Block, Button, ButtonWithHoverOutline } from "./UIElements"
import zeptoid from 'zeptoid';
import getLocalPosition from "../utils/getLocalPosition";
import moveInArray from "../utils/moveInArray";

const Macro = () => {
    type Drag = {type: "pattern" | "composition", patternId: string, dragId: string}

    const [drag, setDrag] = createSignal<Drag>();

    const dragstart = (
      e: DragEvent, 
      {type, patternId, dragId} : 
      {type: "pattern" | "composition", patternId: string, dragId?: string}
    ) => {
        if(!dragId)
            dragId = zeptoid();

        setDrag({
            type,
            patternId,
            dragId
        })
    }

    const drop = (e: DragEvent) => {
        e.preventDefault();
    }

    const dragover = (e:DragEvent) => {
        e.preventDefault()

        if(!e.dataTransfer) return;

        const d = drag();

        if(!d) return;

        const {type: dragType, patternId, dragId} = d;

        const targetType = (e.target as HTMLElement).getAttribute("data-type")

        if(dragType === "pattern" && targetType === "composition"){

            const targetId = (e.target as HTMLElement).getAttribute("data-id")

            if(!targetId){
                if(store.composition.find(pattern => pattern.id === dragId))
                    return
                setStore("composition", produce((composition) => composition.push({id: dragId, patternId})))
                return;
            }

            if(targetId === dragId) return

            const position = getLocalPosition(e)

            if(position.percentage.y < 0) return

            const after = position.percentage.y > 50

            const targetIndex = actions.getBlockIndex(targetId)
            const dragIndex = actions.getBlockIndex(dragId)
            const nextIndex = after ? targetIndex + 1 : targetIndex

            if(dragIndex === -1){
                setStore("composition", produce((composition) => composition.splice(nextIndex, 0, {id: dragId, patternId})))
                return
            }

            setStore("composition", produce((composition) => moveInArray(composition, dragIndex, nextIndex)))

            return;
        }
        
        if(dragType === "composition" && targetType === "composition"){
            const targetId = (e.target as HTMLElement).getAttribute("data-id")

            if(!targetId) return
            if(dragId === targetId) return

            const position = getLocalPosition(e)

            const dragIndex = actions.getBlockIndex(dragId);
            const targetIndex = actions.getBlockIndex(targetId);
            const patternId = e.dataTransfer.getData("pattern-id")

            if(position.percentage.y < 50 && dragIndex !== targetIndex - 1){
                if(dragIndex === -1){
                    setStore("composition", produce((composition) => composition.splice(targetIndex, 0, {id: dragId, patternId})))
                    return
                }
                setStore("composition", produce((composition) => {
                    moveInArray(composition, dragIndex, targetIndex )
                }))
            }else 
            if(position.percentage.y > 50 && dragIndex !== targetIndex + 1){
                if(dragIndex === -1){
                    setStore("composition", produce((composition) => composition.splice(targetIndex + 1, 0, {id: dragId, patternId})))
                    return
                }
                setStore("composition", produce((composition) => {
                    moveInArray(composition, dragIndex, targetIndex + 1)
                }))
            }
        }
    }

    const dragleave = (e: DragEvent) => {
        if(!e.dataTransfer) return;

        const d = drag();
        if(!d) return;

        const {type: dragType, dragId} = d;

        const targetType = (e.target as HTMLElement).getAttribute("data-type")

        if(targetType !== "composition") return;

        const dragIndex = actions.getBlockIndex(dragId);

        if(dragIndex === -1) return;
        
        if ((e.currentTarget as HTMLElement).contains((e.relatedTarget as Node))) {
            return;
          }

        setStore("composition", produce((composition) => {composition.splice(dragIndex, 1)}))
    }


    return (
      <Block class="flex flex-0 w-64 p-2 bg-neutral-100 max-h-1/2 overflow-hidden">
        <div class="flex flex-col flex-1 gap-2">
          <div class="flex gap-2 h-8" >
            <Button 
              selected={store.playMode === "pattern"}
              // class={`${store.playMode === "pattern" ? "bg-black text-white" : "bg-white"}`}
              onclick={()=>actions.setPlayMode("pattern")}
            >PATTERN</Button>  

            <Button 
              selected={store.playMode === "composition"}
              // class={`${store.playMode === "composition" ? "bg-black text-white" : "bg-white"}`}
              onclick={()=>actions.setPlayMode("composition")}
            >COMPOSITION</Button>  
          </div>
          <div class="flex-1 flex gap-2 overflow-hidden">
            <div class="flex flex-col flex-1 overflow-hidden">
                <div class="flex flex-1 overflow-hidden rounded-xl">
                  <div class="flex-1 overflow-auto bg-white p-2">
                    <For each={store.patterns} >
                      {
                        (pattern, i) => (
                          <div 
                            draggable={true} 
                            ondragstart={(e)=>dragstart(e, {type: "pattern", patternId: pattern.id})}
                            ondblclick={()=>actions.setSelectedPatternId(pattern.id)}
                            class="flex mb-2 rounded-xl translate-x-0"
                          >
                            <ButtonWithHoverOutline 
                              class="cursor-pointer w-full flex-1"
                              style={{
                                  background: actions.getPatternColor(pattern.id) || "",
                              }}
                            >#{i()} </ButtonWithHoverOutline>
                          </div> 
                        )
                      }
                    </For>
                  </div>
                </div>
            </div>
            <div class="flex flex-col flex-1 overflow-auto" >
              <div class="flex flex-1 overflow-hidden rounded-xl">
                <div 
                  class="flex-1 overflow-auto bg-white p-2" 
                  ondragover={dragover} 
                  ondrop={drop} 
                  data-type="composition" 
                  data-parent={true}
                  ondragleave={dragleave}
                >
                  <For each={store.composition}>
                    {
                      ({id, patternId}) => <div 
                        draggable={true}
                        ondragstart={(e) => dragstart(e, {type: "composition", patternId: patternId, dragId: id})}
                        ondragover={dragover}
                        class="mb-2 cursor-move"
                        data-type="composition"
                        data-id={id}
                      >
                        <Bar 
                          class="pointer-events-none" 
                          style={{
                            background: actions.getPatternColor(patternId),
                            filter: id === store.selection.blockId ? "brightness(1.2)" : ""
                          }}
                        >
                          #{actions.getPatternIndex(patternId)}
                        </Bar>
                      </div> 
                    }
                  </For>  
                </div>
              </div>
            </div>
          </div>
        </div>
      </Block>
    )               
}

export default Macro