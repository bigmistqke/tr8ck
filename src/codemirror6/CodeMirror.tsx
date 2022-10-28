import { StreamLanguage } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { createEffect, JSX, onMount } from "solid-js";
import { actions } from "../Store";
import s from "./CodeMirror.module.css";
import faust from "./faust";

let language = new Compartment;
const tabSize = new Compartment;

export default (props: JSX.HTMLAttributes<HTMLDivElement> & {code: string, setState?: (state: EditorState) => void}) => {
  let editorRef : HTMLDivElement;
  let editorState: EditorState;
  let editorView: EditorView;

  onMount(()=>{
    editorState = EditorState.create({
      extensions: [
        basicSetup,
        language.of(StreamLanguage.define(faust)),
        tabSize.of(EditorState.tabSize.of(8))
      ],
      doc: props.code
    })

    editorView = new EditorView({
      state: editorState,
      parent: editorRef,
    })

    editorView.contentDOM.addEventListener("focus", () => actions.setCoding(true))
    editorView.contentDOM.addEventListener("blur", () => actions.setCoding(false))
    
  })
  
  createEffect(()=> editorView.contentDOM.innerText = props.code)


  return <div 
    onmousedown={e => e.stopPropagation()}
    class={`flex-1 h-full w-full overflow-auto cursor-text  ${
      s.container
    } ${
      props.class
    }`} 
    ref={editorRef!}
  />
}