import { JSX, JSXElement } from "solid-js";
import cursorEventHandler from "../utils/cursorEventHandler";
import { actions } from "../Store";


const Button = (props: JSX.HTMLAttributes<HTMLButtonElement> & {selected: boolean}) => {
  return <button
  onclick={props.onclick}
  onmousedown={props.onmousedown}
  class={`flex-1 rounded-xl text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors ${
    props.class || ""
  } ${
    props.selected ? "bg-black text-white" : "bg-white"
  }`}
  style={props.style}
>
  {props.children}
</button>
}

const ButtonBar =  (props: JSX.HTMLAttributes<HTMLButtonElement>)  => {
    return <Button
        onclick={props.onclick}
        onmousedown={props.onmousedown}
        class={`h-8 text-xs tracking-widest text-center ${props.class || ""}`}
        style={props.style}
    >
        {props.children}
    </Button>
}



const Block = (props: JSX.HTMLAttributes<HTMLDivElement>) => {
    return (
      <div
          {...props}
          class={`${props.class || ""} rounded-xl uppercase transition-colors`}
      >
          {props.children}
      </div>
    )
}

const Bar =(props: JSX.HTMLAttributes<HTMLDivElement>) => 
    <Block 
      onmousedown={props.onmousedown}
      onmousemove={props.onmousemove}
      onmouseup={props.onmouseup}
      onwheel={props.onwheel}
      class={`${props.class} flex flex-1 h-8 max-h-8 items-center justify-center content-center text-center text-xs tracking-widest`} 
      style={props.style}
    >
        {props.children}
    </Block>

const SliderBar = (props: JSX.HTMLAttributes<HTMLDivElement> & {
  onupdate: (delta: number, timespan: number) => void
}) => 
  {
    const mousedown = () => {
      const start = performance.now();
      cursorEventHandler(({movementX}) => props.onupdate(movementX, performance.now() - start))
    }
    return <Block 
      onmousedown={mousedown}
      class={`${props.class} flex flex-1 h-8 content-center items-center justify-center text-center text-xs tracking-widest bg-white select-none cursor-e-resize`} 
      style={props.style}
    >
        {props.children}
    </Block>
  }

const ButtonWithHoverOutline =  (props: JSX.HTMLAttributes<HTMLButtonElement>) => (
  <button
    onclick={props.onclick}
    class={`flex-1 flex h-8` }
  >
      <div 
          class={`flex flex-1 h-full rounded-xl justify-center items-center text-xs hover:border-4 hover:border-white transition-colors ${
              props.class
          }`}
          style={{
            ...props.style,
            // "min-width": "75px"
          }}                     
      >
      <span>
          {props.children}
      </span>
      </div>
  </button>
)

const Knob = (props: {
  rotation: number, 
  onupdate: (delta: number)=>void,
}) =>{
  const mousedown = () => cursorEventHandler(({movementX}) => props.onupdate(movementX))

  return (
    <button 
        class="inline-block m-auto aspect-square rounded-full bg-black cursor-e-resize" 
        style={{
          height: "32px",
          width: "32px",
          transform: `rotateZ(${props.rotation}deg)`
        }}
        onmousedown={mousedown}
      >
        <span 
          class="inline-block h-1/3 bg-neutral-300 rounded-sm handle mb-2" 
          style={{
            width: "3px",
            "margin-left": "0px",
          }}
        />
      </button>
  )
}

const LabeledKnob = (props: JSX.HTMLAttributes<HTMLDivElement> & {
  rotation: number, 
  onupdate: (delta: number) => void,
  label: string
}) => {
  return (
    <div class={`inline-flex flex-col h-full ${props.class}`} >
      <div class="flex-1 flex">
        <Knob rotation={props.rotation} onupdate={props.onupdate}/>

      </div>
    <span class="flex-0 flex items-center self-center normal-case select-none text-neutral-500 whitespace-nowrap" style={{"font-size": "7pt"}}>{props.label}</span>
    </div>
  )
}

const CenteredLabel = (props: {label: JSXElement | JSXElement[]}) => 
  <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 normal-case text-xs text-neutral-500">
    {
      props.label
    }
  </span>


export {Button, ButtonBar, Bar, Block, SliderBar, ButtonWithHoverOutline, LabeledKnob, CenteredLabel};