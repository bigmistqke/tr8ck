import { JSXElement } from "solid-js";


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
  class={`flex-1 rounded-xl text-sm uppercase bg-default-500 bg-white hover:bg-black hover:text-white ${props.class || ""}`}
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
    children?: JSXElement[] | JSXElement
    class?: string
    style?: {[key: string]: string}
}) => {
    return <div
        class={`${props.class || ""} flex-1 rounded-xl uppercase`}
        style={props.style}
        onmousedown={props.onmousedown}
        onmousemove={props.onmousemove}
        onmouseup={props.onmouseup}
        onwheel={props.onwheel}
    >
        {props.children}
    </div>
}

const Bar = (props: {
  onmouseup?: (e: MouseEvent) => void
  onmousemove?: (e: MouseEvent) => void
  onmousedown?: (e: MouseEvent) => void
  onwheel?: (e: WheelEvent) => void
  children?: JSXElement[] | JSXElement, class?: string, 
  style?: {[key: string]: string}}
) => 
    <Block 
      onmousedown={props.onmousedown}
      onmousemove={props.onmousemove}
      onmouseup={props.onmouseup}
      onwheel={props.onwheel}
      class={`${props.class} h-10 items-center justify-center content-center text-sm`} 
      style={props.style}
    >
        {props.children}
    </Block>

export {Button, ButtonBar, Bar, Block};