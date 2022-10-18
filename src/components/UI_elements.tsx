import { JSX, JSXElement } from "solid-js";
import cursorEventHandler from "../helpers/cursorEventHandler";
import { actions } from "../Store";


const Button = (props: {
  onclick?: (e: MouseEvent) => void, 
  onmousedown?: (e: MouseEvent) => void,
  children?: JSXElement[] | JSXElement, 
  class?: string, 
  style?: {[key: string]: string}
}) => {
  return <button
  onclick={props.onclick}
  onmousedown={props.onmousedown}
  class={`flex-1 rounded-xl text-sm uppercase bg-default-500 bg-white hover:bg-black hover:text-white transition-colors ${props.class || ""}`}
  style={props.style}
>
  {props.children}
</button>
}

const ButtonBar = (props: {
    onclick?: (e: MouseEvent) => void, 
    onmousedown?: (e: MouseEvent) => void,
    children?: JSXElement[] | JSXElement, 
    class?: string, 
    style?: {[key: string]: string}
}) => {
    return <Button
        onclick={props.onclick}
        onmousedown={props.onmousedown}
        class={`h-10 text-sm ${props.class || ""}`}
        style={props.style}
    >
        {props.children}
    </Button>
}


const Block = (props: {
    onmouseup?: (e: MouseEvent) => void
    onmousemove?: (e: MouseEvent) => void
    onmousedown?: (e: MouseEvent) => void
    onwheel?: (e: WheelEvent) => void
    ondragover?: (e: DragEvent) => void
    ondrop?: (e: DragEvent) => void
    children?: JSXElement[] | JSXElement
    class?: string
    style?: {[key: string]: string}
}) => {
    return <div
/*         style={props.style}
        onmousedown={props.onmousedown}
        onmousemove={props.onmousemove}
        onmouseup={props.onmouseup}
        onwheel={props.onwheel}
        ondrop={props.ondrop}
        ondragover={props.ondragover} */
        {...props}
        class={`${props.class || ""} rounded-xl uppercase transition-colors`}

    >
        {props.children}
    </div>
}

const Bar = (props: {
  onmouseup?: (e: MouseEvent) => void
  onmousemove?: (e: MouseEvent) => void
  onmousedown?: (e: MouseEvent) => void
  onwheel?: (e: WheelEvent) => void
  children?: JSXElement[] | JSXElement, 
  class?: string, 
  style?: {[key: string]: string}}
) => 
    <Block 
      onmousedown={props.onmousedown}
      onmousemove={props.onmousemove}
      onmouseup={props.onmouseup}
      onwheel={props.onwheel}
      class={`${props.class} flex flex-1 h-10 max-h-10 items-center justify-center content-center text-sm`} 
      style={props.style}
    >
        {props.children}
    </Block>

const SliderBar = (props: {
  onchange: (delta: number, timespan: number) => void
  children?: JSXElement[] | JSXElement, 
  class?: string, 
  style?: {[key: string]: string}}
) => 
  {
    const mousedown = () => {
      const start = performance.now();
      cursorEventHandler(({movementX}) => props.onchange(movementX, performance.now() - start))
    }
    return <Block 
      onmousedown={mousedown}
      class={`${props.class} flex flex-1 h-10 content-center items-center justify-center text-sm bg-white select-none cursor-e-resize`} 
      style={props.style}
    >
        {props.children}
    </Block>
  }

const ButtonWithHoverOutline = (props: {onclick: (e: MouseEvent) => void, class: string, style: JSX.CSSProperties, children: JSXElement | JSXElement[]}) => (
  <button
    onclick={props.onclick}
    class={`flex-1 flex h-10` }
  >
      <div 
          class={`flex flex-1 h-full rounded-xl justify-center items-center text-sm ${
              props.class
          }`}
          style={props.style}                     
      >
      <span>
          {props.children}
      </span>
      </div>
  </button>
)

const Knob = (props: {
  rotation: number, 
  onchange: (delta: number)=>void,
  label: string
}) => {

  const mousedown = () => cursorEventHandler(({movementX}) => props.onchange(movementX))

  return (
    <div class="inline-flex flex-col h-full ml-2 ">
      <button 
        class="inline-block mx-auto aspect-square rounded-full bg-black cursor-e-resize" 
        style={{
          height: "36px",
          width: "36px",
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
      <span class="flex-1 flex items-end self-center normal-case select-none" style={{"font-size": "8pt"}}>{props.label}</span>
    </div>
  )
}

const CenteredLabel = (props: {label: JSXElement | JSXElement[]}) => 
  <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 normal-case text-xs text-neutral-500">
    {
      props.label
    }
  </span>


export {Button, ButtonBar, Bar, Block, SliderBar, ButtonWithHoverOutline, Knob, CenteredLabel};