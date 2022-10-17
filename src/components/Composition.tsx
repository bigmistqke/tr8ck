import {  createSignal, For, onMount } from "solid-js"
import { produce } from "solid-js/store"
import { actions, setStore, store } from "../Store"
import { Bar, Block } from "./UI_elements"
import zeptoid from 'zeptoid';
import getLocalPosition from "../helpers/getLocalPosition";
import moveInArray from "../helpers/moveInArray";
import autoAnimate from '@formkit/auto-animate'

const Macro = () => {

    let patternRef: HTMLElement, 
        compositionRef: HTMLElement;

    type Drag = {type: "pattern" | "composition", patternId: string, dragId: string}

    const [drag, setDrag] = createSignal<Drag>();

    const dragstart = (e: DragEvent, {type, patternId, dragId}: Drag) => {
        if(!dragId)
            dragId = zeptoid();

        console.log('type is ', type, patternId, dragId, e.dataTransfer);

        setDrag({
            type,
            patternId,
            dragId
        })

      /*   e.dataTransfer!.setData("type", type);
        e.dataTransfer!.setData("pattern-id", patternId);
        e.dataTransfer!.setData("drag-id", dragId); */
    }

    const drop = (e) => {
        e.preventDefault();
    }

    const dragover = (e:DragEvent) => {
        e.preventDefault()

        if(!e.dataTransfer) return;

        // console.log("dataTransfer is ", e.dataTransfer.)

        // const dragType = e.dataTransfer.getData("type")

        const d = drag();

        if(!d) return;

        const {type: dragType, patternId, dragId} = d;

        const targetType = (e.target as HTMLElement).getAttribute("data-type")

        // console.log(dragType, targetType);

        if(dragType === "pattern" && targetType === "composition"){
/*             const dragId = e.dataTransfer.getData("drag-id")
            const patternId = e.dataTransfer.getData("pattern-id") */

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
            // const dragId = e.dataTransfer.getData("drag-id")
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

/*     onMount(()=>{
        if(!patternRef || !compositionRef) return;
        autoAnimate(patternRef)
        autoAnimate(compositionRef)
    }) */


    return <div class="flex-1 flex gap-2 m-2 overflow-hidden">
        <div class="flex flex-col flex-1 overflow-hidden">
            {/* <Bar class="mb-2 flex-grow-0 flex-auto">patterns</Bar> */}
            <div class="flex flex-1 overflow-hidden rounded-xl">
                <div class="flex-1 overflow-auto bg-white p-2" ref={patternRef}>
                    <For each={store.patterns} >
                        {
                            (pattern, i) => <div 
                                draggable={true} 
                                ondragstart={(e)=>dragstart(e, {type: "pattern", patternId: pattern.id})}
                                class="mb-2 rounded-xl bg-red-500 translate-x-0"
                            >
                                <Bar 
                                    style={{
                                        background: actions.getPatternColor(pattern.id) || "",
                                    }}
                                >#{i()} </Bar>
                            </div> 
                        }
                    </For>
                </div>
                
            </div>
            
        </div>
        <div class="flex flex-col flex-1 overflow-auto" >
            {/* <Bar class="mb-2 flex-grow-0 flex-auto">composition</Bar> */}
            <div class="flex flex-1 overflow-hidden rounded-xl">
                <div 
                    ref={compositionRef}
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
                                class="mb-2"
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
        
                    
}

export default Macro