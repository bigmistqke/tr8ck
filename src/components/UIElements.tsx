import { JSX, JSXElement } from "solid-js"
import cursorEventHandler from "../utils/cursorEventHandler"
import { actions } from "../Store"

function Button(
  props: JSX.HTMLAttributes<HTMLButtonElement> & { selected?: boolean }
) {
  return (
    <button
      {...props}
      class={`flex-1 rounded-xl text-xs tracking-widest uppercase hover:bg-black hover:text-white select-none transition-colors ${
        props.class || ""
      } ${props.selected ? "bg-black text-white" : "bg-white"}`}
      style={props.style}
    >
      {props.children}
    </button>
  )
}

const ButtonBar = (
  props: JSX.HTMLAttributes<HTMLButtonElement> & { selected?: boolean }
) => {
  return (
    <Button
      {...props}
      class={`h-6 text-xs tracking-widest text-center select-none ${props.class || ""}`}
    >
      {props.children}
    </Button>
  )
}

const Block = (props: JSX.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      class={`${props.class || ""} rounded-xl transition-colors`}
    >
      {props.children}
    </div>
  )
}

const Bar = (props: JSX.HTMLAttributes<HTMLDivElement>) => (
  <Block
    {...props}
    class={`${props.class} flex flex-1 h-6 max-h-6 items-center justify-center content-center text-center text-xs tracking-widest`}
  >
    {props.children}
  </Block>
)

const SliderBar = (
  props: JSX.HTMLAttributes<HTMLDivElement> & {
    onupdate: (delta: number, timespan: number) => void
  }
) => {
  const mousedown = () => {
    const start = performance.now()
    cursorEventHandler(({ movementX }) =>
      props.onupdate(movementX, performance.now() - start)
    )
  }
  return (
    <Block
      {...props}
      onmousedown={mousedown}
      class={`${props.class} flex flex-1 h-6 content-center items-center justify-center text-center text-xs tracking-widest uppercase bg-white select-none cursor-e-resize`}
    >
      {props.children}
    </Block>
  )
}

const ButtonWithHoverOutline = (
  props: JSX.HTMLAttributes<HTMLButtonElement> & {
    buttonClass?: string 
    selected?: boolean
  }
) => (
  <button onclick={props.onclick} class={`flex-1 flex h-6 overflow-hidden ${props.class}`}>
    <div
      class={`flex flex-1 h-full justify-center items-center text-xs rounded-xl uppercase hover:border-4 hover:border-white select-none  transition-colors ${
        props.buttonClass
      } ${
        props.selected ? "border-white border-4" : ""
      }`}
      style={props.style}
    >
      <span>{props.children}</span>
    </div>
  </button>
)

const AddButton = (props: JSX.HTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}) => (
  <ButtonWithHoverOutline
    {...props}
    buttonClass={`flex-0 bg-white hover:bg-black hover:text-white `}
  >
  +
  </ButtonWithHoverOutline>
)

const Knob = (props: {
  rotation: number
  onupdate: (delta: number) => void
}) => {
  const mousedown = () =>
    cursorEventHandler(({ movementX }) => props.onupdate(movementX))

  return (
    <button
      class="inline-block m-auto aspect-square rounded-full bg-black cursor-e-resize select-none "
      style={{
        height: "32px",
        width: "32px",
        transform: `rotateZ(${props.rotation}deg)`,
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

const LabeledKnob = (
  props: JSX.HTMLAttributes<HTMLDivElement> & {
    rotation: number
    onupdate: (delta: number) => void
    label: string
  }
) => {
  return (
    <div class={`inline-flex flex-col h-full ${props.class}`}>
      <div class="flex-1 flex">
        <Knob rotation={props.rotation} onupdate={props.onupdate} />
      </div>
      <span
        class="flex-0 flex items-center self-center normal-case select-none text-neutral-500 whitespace-nowrap select-none "
        style={{ "font-size": "7pt" }}
      >
        {props.label}
      </span>
    </div>
  )
}

const CenteredLabel = (props: { label: JSXElement | JSXElement[] }) => (
  <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 normal-case text-xs text-center text-neutral-500 whitespace-pre select-none ">
    {props.label}
  </span>
)

export {
  Button,
  ButtonBar,
  Bar,
  Block,
  SliderBar,
  ButtonWithHoverOutline,
  LabeledKnob,
  CenteredLabel,
  AddButton
}
