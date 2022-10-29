import { createEffect } from "solid-js"
import { actions, store } from "../../Store"
import { CompositionElementProps } from "../../types"
import { ButtonWithHoverOutline } from "../UIElements"

export default (props: {
  element: CompositionElementProps
} ) => { 
   return (
     <div 
      data-id={props.element.id}
     >
       <ButtonWithHoverOutline 
        class={`${store.dragging.composition ? "pointer-events-none" : ""} w-full`} 
        style={{
          background: actions.getPatternColor(props.element.patternId),
          //  filter: props.element.id === store.selection.blockId ? "brightness(1.2)" : ""
        }}
        active={
          props.element.id === store.selection.blockId
        }
        selected={
          (store.selection.composition && store.selection.composition.indexOf(props.element) !== -1)
        }
       >
         #{actions.getPatternIndex(props.element.patternId)}
       </ButtonWithHoverOutline>
     </div>  
   )
 }