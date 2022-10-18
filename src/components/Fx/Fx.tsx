import { FaustAudioWorkletNode } from "faust2webaudio"
import { For } from "solid-js"
import { Block } from "../UI_elements"
import Parameter from "./Parameter"

export default (props: {
  name: string, 
  node?: FaustAudioWorkletNode, 
  parameters: any[]
  class?: string
}) => {
  return (
    <Block class={`inline-flex flex-col p-1 mr-2 h-full text-center bg-neutral-200 rounded-lg ${props.class}`} draggable={true}>
      <span class="select-none cursor-move" style={{"font-size": "8pt"}}>{props.name}</span>
      <div class="flex-1 gap-2 h-full mr-2">
        <For each={props.parameters}>
          {
            (parameter) => <Parameter parameter={parameter} node={props.node}/>
          }

        </For>
      </div>
    </Block>
  )
}