import { StreamLanguage } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { createEffect, createSignal, JSX, onMount, Show } from "solid-js";
import { actions } from "../Store";
import s from "./CodeMirror.module.css";
import faust from "./faust";

let language = new Compartment;
const tabSize = new Compartment;

import { TiArrowDown, TiArrowUp } from "solid-icons/ti";

const ErrorMessage = (props: {error: string, reverseIcon?: boolean, width: number}) => {
  const [full, setFull] = createSignal(false);
  const [icon, setIcon] = createSignal(false);

  let container: HTMLDivElement;
  let message: HTMLDivElement;

  createEffect(() => {
    props.error;
    setIcon(message.offsetHeight > container.offsetHeight)
  })

  createEffect(() => {
    console.log("WIDTH", props.width)
  })

  return (
    <div 
      class={`relative flex bg-red-200 text-xs text-mono whitespace-pre-wrap overflow-auto ${
        full() ? "max-h-24" : "max-h-10"
      }`}
      style={{
        "max-width": `${props.width}px`,
      }}
      ref={container!}
    >
      <Show when={icon()}>
        <button class="absolute top-0 right-2 h-6 w-6" onmousedown={() => setFull(full => !full)}>
            <Show when={(props.reverseIcon && full()) || (!props.reverseIcon && !full())} fallback={
              <TiArrowDown class="w-full h-full"/>
            }>
              <TiArrowUp class="w-full h-full"/>
            </Show>
        </button>
      </Show>
      <div class={`flex-1 ${
        full() ? "overflow-auto" : "overflow-hidden"
      }`}>
        <div 
          class="p-2 pr-8" 
          ref={message!}
        >
          {props.error}
        </div>

      </div>

    </div>
  )
}


export default (props: 
  JSX.HTMLAttributes<HTMLDivElement> 
  & {
    code: () => string
    setState?: (state: EditorState) => void
    error?: string
    reverseIcon?: boolean
    containerClass?: string
  }
) => {
  let editorRef : HTMLDivElement;
  let editorState: EditorState;
  let editorView: EditorView;

  const [width, setWidth] = createSignal(0);

  // TODO: can not get error highlighting to work consistently
  /* const regexpLinter = linter(view => {
    let diagnostics: Diagnostic[] = []
  
    // console.log(view.state);
    if(props.error){
      const [lineString, _, error] = props.error.replace("Error: FaustDSP : ", "").split(":");
      console.log(error);
      const line = +lineString - 1;
      let from = view.state.doc.text.slice(0, line).join(' ').length;
      let to = view.state.doc.text.slice(0, line + 1).join(' ').length;
    
      console.log(from, to);
    
      diagnostics.push({
        from,
        to,
        severity: "error",
        message: error,
      })
    }

    console.log("diagnostics", diagnostics);
  

    return diagnostics
  }) */
  

  onMount(()=>{
    editorState = EditorState.create({
      extensions: [
        basicSetup,
        language.of(StreamLanguage.define(faust)),
        tabSize.of(EditorState.tabSize.of(8)),
      ],
      doc: props.code()
    })

    editorView = new EditorView({
      state: editorState,
      parent: editorRef,
    })

    editorView.contentDOM.addEventListener("focus", () => actions.setCoding(true))
    editorView.contentDOM.addEventListener("blur", () => actions.setCoding(false))
    resizeObserver.observe(editorRef);
    setWidth(editorRef.offsetWidth);
  })
  
  createEffect(()=> editorView.contentDOM.innerText = props.code())

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      setWidth(entry.contentRect.width)
    }
  });

  return <div class={`rounded-lg overflow-hidden shadow-sm ${
    !props.error ? "rounded-br-md" : ""
  } ${
    props.containerClass
  }`}>
    <div 
      onmousedown={e => e.stopPropagation()}
      class={`flex-1 overflow-auto cursor-text  ${
        s.container
      } ${
        props.class
      }`} 
      ref={editorRef!}
    />
    <Show when={props.error}>
      <ErrorMessage error={props.error!} reverseIcon={props.reverseIcon} width={width()}/>      
    </Show>
  </div>
}