import { For } from "solid-js"
import { store } from "../../Store"
import { CompositionGroupProps } from "../../types"
import { Block } from "../UIElements"
import CompositionBlock from "./CompositionBlock"

export default (props: {group: CompositionGroupProps}) => {


  return (
    <Block 
      extraClass={`relative absolute w-full h-full top-0 left-0 p-1 rounded-lg border-2 hover:border-2 hover:border-neutral-600 ${
        store.selection.composition.indexOf(props.group) !== -1 ? "border-neutral-600" : "border-transparent"
      }`} 
      style={{
        background: props.group.color
      }}
    >
      <div class="pointer-events-none flex flex-col gap-2">
        <For each={props.group.blocks}>
            {
              block => <CompositionBlock block={block}/>
            }
        </For>
      </div>
      
    </Block>
  )
}