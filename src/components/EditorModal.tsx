import { EditorState } from "@codemirror/state";
import { TCompiledDsp } from "faust2webaudio/src/types";
import { createSignal, onMount } from "solid-js";
import CodeMirror from "../codemirror6/CodeMirror";
import cursorEventHandler from "../utils/cursorEventHandler";
import { actions } from "../Store";
import { Button } from "./UIElements";
import { FaustCompilationResponse, FaustElement } from "../types";

import s from "./EditorModal.module.css";

export interface EditorModalProps {
  id: string
  code: () => string
  compile: (code: string) => Promise<FaustCompilationResponse>
}

export default (props: EditorModalProps) => {
  let editorRef : HTMLDivElement;
  let containerRef : HTMLDivElement;

  const [position, setPosition] = createSignal({left: (window.innerWidth - 504) / 2, top: (window.innerHeight - 412) / 2})
  const [dragging, setDragging] = createSignal(false)
  const [state, setState] = createSignal<EditorState>();
  const [error, setError] = createSignal<string | undefined>()


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
    const innerText = (containerRef.querySelector(".cm-content") as HTMLElement).innerText;
    const code = innerText.replaceAll(/\n\n/g, "\n") 
    console.log("code is ", code);

    if(!code) return;
    const result = await props.compile(code);
    setError("error" in  result ? result.error : undefined)
  }

  const close = (e: MouseEvent) => {
    e.stopPropagation();
    actions.removeFromEditors(props.id)
  }

  return (
    <div 
      class={`absolute w-full h-full z-50 ${
        dragging() ? "" : "pointer-events-none"
      }`}
      
    >
      <div 
        ref={containerRef!}
        onmousedown={mousedown}
        class={`absolute bg-neutral-100 max-w-full max-h-full pb-12 p-2 rounded-xl cursor-move shadow-xl pointer-events-auto resize ${
          s.editorModal
        }`}
        style={{
          "margin-left": position().left +"px",
          "margin-top": position().top +"px",
          // "max-width": "100vw"
        }}

      >
        <div class={`flex flex-col gap-2 ${
          dragging() ? "pointer-events-none select-none" : ""}
        }`}>
          <div class="flex flex-0 gap-2 h-6">
            <Button 
              onmousedown={compile}
            >
              compile
            </Button>
            <Button onmousedown={close} children="close"/>
          </div>
          <div class="">
            <CodeMirror 
              code={props.code}
              setState={setState}
              class={`min-w-full h-64 w-128 resize ${
                dragging() ? "pointer-events-none select-none" : ""
              }`}
              /* containerStyle={{
                "max-width": "75v"
              }} */
              error={error()}
              reverseIcon={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}