import { StreamLanguage } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { JSX, onMount } from "solid-js";
import s from "./CodeMirror.module.css";
import faust from "./faust";

let language = new Compartment;
const tabSize = new Compartment;

export default (props: JSX.HTMLAttributes<HTMLDivElement> & {code: string, setState: (state: EditorState) => void}) => {
  let editorRef : HTMLDivElement;

  onMount(()=>{
    let state = EditorState.create({
      extensions: [
        basicSetup,
        language.of(StreamLanguage.define(faust)),
        tabSize.of(EditorState.tabSize.of(8))
      ],
      doc: props.code
    })
    props.setState(state);
    new EditorView({
      state,
      parent: editorRef
    })

  })

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