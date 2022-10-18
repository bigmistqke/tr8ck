import { onMount, createSignal, createEffect, batch, onCleanup } from "solid-js"
import cursorEventHandler from "../../../helpers/cursorEventHandler"
import { actions, store } from "../../../Store"
import { Sampler } from "../../../types"

export default (props: {
  canvasWidth: number
  instrument: Sampler
}) => {
  const [start, setStart] = createSignal<number>(0)
  const [end, setEnd] = createSignal<number>(0)
  const [dragging, setDragging] = createSignal<"start"|"end"|"both"|undefined>()

  let dom: HTMLDivElement;

  const init = ()=> {
    window.addEventListener("resize", resize)
  }

  const cleanup = () => {
    window.removeEventListener("resize", resize)
  }

  const resize = () => {
    batch(() => {
      calculateOffset("start");
      calculateOffset("end");
    })
  }

  const calculateOffset = (type: "start" | "end") => {
    if(!props.instrument.waveform) return;
    const value = (props.instrument.navigation.start - props.instrument.selection[type]) 
      * props.canvasWidth / (props.instrument.waveform.length - props.instrument.navigation.start - props.instrument.navigation.end);
    type === "start" 
      ? setStart(value)
      : setEnd(value )
  }

  const translateHandle = (type: "start"|"end", delta: number) => {
    const waveform = props.instrument.waveform
    if(waveform === undefined) return;
    actions.setSamplerSelection(type, value => {
      value = value - delta;
      if(type === "start"){
        value = Math.max(0, value);
        value = Math.min(props.instrument.selection.end, value);
      }else{
        value = Math.max(props.instrument.selection.start, value);
        value = Math.min(waveform.length, value);
      }
      return value
    });
  }

  const calculateSelection = async (e: MouseEvent, type: "start" | "end" | "both") => {
    if(e.button === 1) return
    e.stopPropagation();
    setDragging(type);
    if(store.keys.shift) return;
    if(!props.instrument.waveform) return;
    let x: number = 0, 
        deltaX: number = 0;
    
    const ratio = props.canvasWidth  / (props.instrument.waveform.length - props.instrument.navigation.start - props.instrument.navigation.end);

    await cursorEventHandler(({clientX}) => {
      if(x){
        deltaX = (x - clientX);
        deltaX = deltaX / ratio;
        if(type === "both" || store.keys.control){
          translateHandle("start", deltaX);
          translateHandle("end", deltaX);
        }else{
          translateHandle(type, deltaX);
        }
      }
      x = clientX;
    })

    setDragging(undefined);
  }

  const clearSelection = () => {
    if(props.instrument.waveform) return;
    setStart(0)
    setEnd(props.canvasWidth * -1)
  }


  onMount(init)
  onCleanup(cleanup)

  createEffect(() => calculateOffset("start"))
  createEffect(() => calculateOffset("end"))
  createEffect(clearSelection)

  return (
    <div class="absolute w-full h-full top-0">
      <div
        class="absolute z-10 h-full overflow-hidden select-none cursor-move" 
        style={{
          left: start() * -1 +"px",
          right: (props.canvasWidth + end()) + "px"
        }}
        onmousedown={e => calculateSelection(e, "both")}
      >
        <div 
          class={`absolute h-full w-8 select-none transition-opacity  hover:bg-gradient-to-r from-white to-transparent hover:opacity-70 z-40 cursor-ew-resize ${
            dragging() === "start" ? "bg-gradient-to-r opacity-50" : "opacity-0"
          }`} 
          style={{
            left: "0px"
          }}
          onmousedown={e => calculateSelection(e, "start")}
          ref={dom!}
        />
        <div 
          class={`absolute h-full w-8 select-none transition-opacity  hover:bg-gradient-to-l from-white to-transparent hover:opacity-70 z-40 cursor-ew-resize ${
            dragging() === "end" ? "bg-gradient-to-l opacity-50" : "opacity-0"
          }`}
          style={{
            right: "0px"
          }}
          onmousedown={e => calculateSelection(e, "end")}
        />
         <div class="h-full w-full bg-white opacity-50 "/>
      </div>
    </div>
  )
}