import { createSignal, For, JSX, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { actions } from "../Store";
import { Choice } from "../types";
import { Button } from "./UIElements";

export interface ContextMenuProps{
  options: Choice[]
  left: number,
  bottom: number    
}

interface Direction extends JSX.CSSProperties  {
  right?: string,
  left?: string,
  top?: string,
  bottom?: string
}

export default (props: ContextMenuProps) => {
  const [mounted, setMounted] = createSignal(false);
  const [direction, setDirection] = createSignal<Direction>({
    left: props.left +"px",
    bottom: props.bottom +"px"
  })

  let container : HTMLDivElement

  onMount(() => {
    const bounds = container.getBoundingClientRect();
    let dir: Direction = {};

    if(bounds.x + bounds.width > window.innerWidth){
      dir.right = window.innerWidth - props.left +"px";
    }else{
      dir.left = props.left +"px";
    }

    if(bounds.y + bounds.height > window.innerHeight){
      dir.top = window.innerHeight - props.bottom +"px";
    }else{
      dir.bottom = props.bottom +"px";
    }

    setDirection(dir);  
    setMounted(true);  
  })

  const close = function(){
    setTimeout(()=>{
      actions.closeContextMenu();
      window.removeEventListener("mousedown", close)
    }, 0)

  }

  onMount(() => {
    window.addEventListener("mousedown", close)
  })

  return (
    <Portal>
      <div 
        ref={container!}
        class={`absolute grid w-32 gap-2 z-50 p-2 rounded-md bg-neutral-100 drop-shadow-lg ${!mounted() ? "opacity-0" : ""}`}
        style={direction()}
      >
        <For each={props.options}>
          {
            ({title,callback}) => (
              <Button
                class="w-full h-6 lowercase"
                onmousedown={callback}
              >{title}</Button>
            )
          }
        </For> 
      </div>
    </Portal>
    
  )
}