import { EditorState } from "@codemirror/state";
import { TCompiledDsp } from "faust2webaudio/src/types";
import { createSignal, onMount } from "solid-js";
import CodeMirror from "../codemirror6/CodeMirror";
import cursorEventHandler from "../helpers/cursorEventHandler";
import { actions } from "../Store";
import { Button } from "./UIElements";



export default (props: {
  id: string
  code: string
  oncompile: (dsp: TCompiledDsp) => void
}) => {
  let editorRef : HTMLDivElement;
  let containerRef : HTMLDivElement;

  const [position, setPosition] = createSignal({left: (window.innerWidth - 504) / 2, top: (window.innerHeight - 412) / 2})
  const [dragging, setDragging] = createSignal(false)
  const [state, setState] = createSignal<EditorState>();

  const mousedown = async () => {
    setDragging(true);
    await cursorEventHandler(({movementX, movementY}) => {
      setPosition(({top, left}) => ({
        top: top + movementY,
        left: left + movementX
      })
    )})
    setDragging(false);
  }


  const compile = async (e: MouseEvent) => {
    e.stopPropagation();
    // TODO: find out the proper way to do this...
    const code = (containerRef.querySelector(".cm-content") as HTMLElement).innerText;
    if(!code) return;
    const dsp = await actions.compileFaust(code)
    if(!dsp) return;
    props.oncompile(dsp);
  }

  const close = (e: MouseEvent) => {
    e.stopPropagation();
    actions.removeFromEditors(props.id)
  }

  return (
    <div 
      class={`absolute w-full h-full z-10 ${
        dragging() ? "" : "pointer-events-none"
      }`}
    >
      <div 
        ref={containerRef!}
        onmousedown={mousedown}
        class="absolute bg-neutral-200 pb-12 p-4 rounded-xl cursor-move shadow-xl pointer-events-auto resize"
        style={{
          "margin-left": position().left +"px",
          "margin-top": position().top +"px"
        }}

      >
        <div class={`flex flex-col gap-2 ${
          dragging() ? "pointer-events-none select-none" : ""}
        }`}>
          <div class="flex flex-0 gap-2 h-12">
            <Button 
              class="h-12" 
              onmousedown={compile}
            >
              save
            </Button>
            <Button 
              class="h-12" 
              onmousedown={(e) => {
                e.stopPropagation();
              }}
            >
              save as
            </Button>
            <Button class="h-12" onmousedown={close} children="close"/>
          </div>
          <div>
            <CodeMirror 
              code={props.code}
              setState={setState}
              class={dragging() ? "pointer-events-none select-none" : ""}
            />
          </div>
        </div>
      </div>
    </div>
  )
}