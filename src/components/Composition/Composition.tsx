import {  For } from "solid-js"
import { produce } from "solid-js/store"

import getLocalPosition from "../../utils/getLocalPosition";

import { actions, setStore, store } from "../../Store"

import { Block, Button } from "../UIElements"
import PatternElement from "./PatternElement";

import { CompositionGroupProps, CompositionElementProps, Choice } from "../../types";
import CompositionBlock from "./CompositionBlock";

export default () => {
  const dragover = (e:DragEvent) => {
    e.preventDefault()

    const drag = store.dragging.composition;

    if(!drag) return;

    const targetId = (e.target as HTMLElement).getAttribute("data-id")
    const position = getLocalPosition(e).percentage;

    actions.dragComposition(targetId!, drag, position)
  }

  const dragleave = (e: DragEvent) => {
    const drag = store.dragging.composition;
    if(!drag) return;

    const dragIndex = actions.getBlockIndex(drag.id); 
    if ((e.currentTarget as HTMLElement).contains((e.relatedTarget as Node))) {return;}

    setStore("composition", produce((composition) => {composition.splice(dragIndex, 1)}))
  }
  
  const drop = (e: DragEvent) => {e.preventDefault()}

  const contextMenu = (e: MouseEvent) => {
    const options : Choice[] = [{
      title: "new pattern",
      callback: actions.createPattern
    }];

    if(store.loopingBlock){
      options.push({
        title: "stop loop",
        callback: actions.resetLoopingBlock
      })
    }

    actions.openContextMenu({e, options})
  }

  return (
    <Block 
      extraClass="flex flex-0 w-64 p-2 bg-neutral-100 max-h-1/2 overflow-hidden"
      oncontextmenu={contextMenu}
    >
      <div class="flex flex-col flex-1 gap-2">
        <div class="flex gap-2 h-6" >
          <Button 
            selected={store.playMode === "pattern"}
            onclick={()=>actions.setPlayMode("pattern")}
          >LOOP</Button>  
          <Button 
            selected={store.playMode === "composition"}
            onclick={()=>actions.setPlayMode("composition")}
          >COMP</Button>  
        </div>
        <div class="flex-1 flex gap-2 overflow-hidden">
          <div class="flex flex-col flex-1 overflow-hidden">
              <div class="flex flex-1 overflow-hidden rounded-xl">
                <div class="flex-1 overflow-auto bg-white p-2">
                  <For each={store.patterns} >
                    {
                      (pattern, i) => <PatternElement pattern={pattern} index={i()}/>
                    }
                  </For>
                </div>
              </div>
          </div>
          <div class="flex flex-col flex-1 overflow-auto" >
            <div class="flex flex-1 overflow-hidden rounded-xl">
              <div 
                class="flex-1 flex flex-col gap-2 overflow-auto bg-white p-2" 
                ondragover={dragover} 
                ondragleave={dragleave}
                ondrop={drop} 
              >
                <For each={store.composition}>
                  {
                    (block: CompositionElementProps | CompositionGroupProps) => 
                      <CompositionBlock block={block}/>
                      
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

