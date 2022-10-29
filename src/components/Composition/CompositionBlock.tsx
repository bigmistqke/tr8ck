import { actions, store } from "../../Store";
import { CompositionElementProps, CompositionGroupProps } from "../../types";
import CompositionElement from "./CompositionElement"
import CompositionGroup from "./CompositionGroup";

export default (props: {
  block: (CompositionElementProps | CompositionGroupProps)
} ) => {
  const resetSelection = () => {
    actions.resetCompositionSelection();
    window.removeEventListener("mousedown", resetSelection);
  }
 
   const dragStart = () => {
     actions.setDragging("composition", props.block.type === "group" ? {
      id: props.block.id,
      type: "composition"      
     } :{
       id: props.block.id,
       patternId: props.block.patternId,
       type: "composition"
     })
   }

   const dragEnd = () => actions.setDragging("composition", undefined)

   const contextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
        
    if(store.selection.composition.length === 0) {
      actions.startCompositionSelection(props.block)
    }

    const block = props.block

    const groupOptions = block.type === "group" && store.selection.composition.length === 1 
      ? [{
        title: "ungroup",
        callback:  () => actions.ungroupCompositionGroup(block)
      }] 
      : []
    
    actions.openContextMenu({
      e,
      options: [{
        title: "duplicate",
        callback: actions.duplicateCompositionSelection
      }, {
        title: "loop",
        callback: actions.loopCompositionSelection
      },{
        title: "group",
        callback: actions.groupCompositionSelection
      },
      ...groupOptions
    ]
    })
   }

   const mouseDown = (e) => {
    if(e.button !== 0) {
      e.stopPropagation();
      return;
    }
    if(!store.keys.control) {
      actions.resetCompositionSelection();

      return
    }
    e.stopPropagation()

    if(store.selection.composition.length === 0){
      actions.startCompositionSelection(props.block)
      window.addEventListener("mousedown", () => resetSelection());
    }else{
      actions.endCompositionSelection(props.block)
    }
  }

  return (
    <div
      draggable={true}
      onmousedown={mouseDown}
      ondragstart={dragStart}
      ondragend={dragEnd}
      class="cursor-move"
      data-id={props.block.id}
      oncontextmenu={contextMenu}
    >
      {
        props.block.type === "element" 
          ? <CompositionElement element={props.block}/> 
          : <CompositionGroup group={props.block}/>
      }
    </div>
  ) 
  
 
}