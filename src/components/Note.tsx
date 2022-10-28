import { createEffect, createSignal, Match, onMount, Show, Switch } from "solid-js"
import ftom from "../utils/ftom"
import mton from "../utils/mton"
import { actions, store } from "../Store"
import { ActiveNote, Note as NoteType } from "../types"

const Note = (props: {
  setNote: (note: Note) => void
  note: Note
  shouldBlink: boolean
  class: string
}) => {

  onMount(()=>{
    console.log('mount!')
  })

  const [hovered, setHovered] = createSignal(false);

  const getColor = () => {
    if (props.note.type === "inactive") return ""
    if (props.note.type === "silence") return "gray"
    return actions.getColorInstrument(props.note.instrumentIndex)
  }

  const setSilence = (e) => {
    e.preventDefault()
    props.setNote(
      shouldDeactivate()
        ? { type: "inactive" }
        : { type: "silence" }
    )
  }

  const shouldDeactivate = () =>
      (props.note.type === "silence") || (
        props.note.type === "active" &&
        store.selection.instrumentIndex === props.note.instrumentIndex &&
        props.note.frequency === store.selection.frequency
      )

  const setNote = () => {
    

    if(store.keys.shift){
      if(props.note.type === "active"){
        actions.setSelectedInstrumentIndex(props.note.instrumentIndex)
        actions.setSelectedFrequency(props.note.frequency)
      }
      return;
    }

    

    props.setNote(
      shouldDeactivate()
        ? { type: "inactive" }
        : {
            type: "active",
            frequency: store.selection.frequency,
            instrumentIndex: store.selection.instrumentIndex,
          }
    )
  }

  const mouseout = () => setHovered(false)
  const mouseenter = () => setHovered(true)

  createEffect(() => {
    if(store.keys.control && hovered() && store.bools.mousedown){
      props.setNote(
        {
          type: "active",
          frequency: store.selection.frequency,
          instrumentIndex: store.selection.instrumentIndex,
        }
      )
    }
  })

  createEffect(() => {
    if(store.keys.alt && hovered() && store.bools.mousedown){
      props.setNote(
        {
          type: "inactive",
        }
      )
    }
  })

  return (
    <button
      onclick={setNote}
      oncontextmenu={setSilence}
      onmousemove={mouseenter}
      onmouseout={mouseout}
      class={`flex-1 flex overflow-auto flex-row ${props.class} items-center`}
    >
      <div
        class={`flex flex-1 h-full relative overflow-hidden rounded-xl hover:bg-selected-instrument ${
          props.shouldBlink ? "bg-white" : "bg-black"
        }`}
        style={{
          background: getColor(),
          "min-height": "1rem",
          filter: props.shouldBlink ? "brightness(1.5)" : "",
        }}
      > 
        <Switch>
          <Match when={props.note.type === "active"}>
            <div class="h-full flex-1 self-center flex items-center justify-center text-xs">
              {mton(ftom((props.note as ActiveNote).frequency))}
            </div>
          </Match>
          {/* <Match when={props.note.type === "silence"}>
            <div class="flex-1 bg-neutral-500"/>
          </Match> */}
        </Switch>
        
      </div>
    </button>
  )
}
export type Note = NoteType
export default Note
