import { FaustAudioWorkletNode } from "faust2webaudio"
import { For } from "solid-js"
import { createStore } from "solid-js/store"
import cursorEventHandler from "../helpers/cursorEventHandler"
import { actions, store } from "../Store"
import { FxParameter } from "../types"
import { Block, Button } from "./UI_elements"

const Parameter = (props: {parameter: FxParameter, node: FaustAudioWorkletNode}) => {
  const [_, setParameter] = createStore<FxParameter>(props.parameter);

  const mousedown = async () => {
    const range = props.parameter.max - props.parameter.min;
    const track = store.tracks[store.selection.track];
    await cursorEventHandler(({movementX}) => {
      const value = props.parameter.value + movementX * range / 500
      if(value < props.parameter.min || value > props.parameter.max) return;
      setParameter("value", value);
      if(
        !(props.node === track.pitchshifter 
        && props.parameter.label === "shift")        
      ){
        props.node.setParamValue(props.parameter.address, value)
      }else{
        props.node.setParamValue(props.parameter.address, value + track.pitch)
      }
    })
  }

  return <div class="inline-flex flex-col h-full ml-2 ">
    <button 
      class="inline-block mx-auto aspect-square rounded-full bg-black cursor-e-resize" 
      style={{
        height: "36px",
        width: "36px",
        transform: `rotateZ(${(props.parameter.value - props.parameter.min) / (props.parameter.max - props.parameter.min) * 180 - 90}deg)`
      }}
      onmousedown={mousedown}
    >
      <span 
        class="inline-block h-1/3 bg-slate-300 rounded-sm handle mb-2" 
        style={{
          width: "3px",
          "margin-left": "0px",
        }}
      />
    </button>
    <span class="flex-1 flex items-end self-center normal-case select-none" style={{"font-size": "8pt",}}>{props.parameter.label}</span>
  </div>
}

const FX = (props: {name: string, node: FaustAudioWorkletNode, parameters: any[]}) => {
  return (
    <Block class={`inline-flex flex-col p-1 mr-2 h-full text-center bg-slate-200 rounded-lg`}>
      <span class="select-none" style={{"font-size": "8pt"}}>{props.name}</span>
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

export default () => {
  return (
    <div class="p-2 pt-0 " >
      <div class="flex gap-2 w-full h-2 mb-2 overflow-hidden">
        <For each={store.tracks}>
          {
            (track, index) => (
              <Button 
                class={`${
                  store.selection.track === index() 
                  ? "bg-black" 
                  : "bg-white"
                } flex-1 h-full`}
                // onclick={() => actions.setSelectedTrack(index())}
              />
            )
          }
        </For>
      </div>
      <Block class="gap-2 h-24 p-2 bg-white whitespace-nowrap overflow-x-auto overflow-y-hidden">
        <For each={store.tracks[store.selection.track].fxChain}>
          {
            (fx) => <>
              <FX name={fx.name} node={fx.node} parameters={fx.parameters}/>
            </>
          }
        </For>
      </Block>
    </div>
    
  )
}
