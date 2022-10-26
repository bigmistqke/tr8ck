import { createEffect, createSignal, Show } from "solid-js"
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

  const [hovered, setHovered] = createSignal(false);

  const getColor = () => {
    if (!props.note.active) return ""
    return actions.getColorInstrument(props.note.instrumentIndex)
  }

  const setNote = () => {

    if(store.keys.shift){
      if(props.note.active){
        actions.setSelectedInstrumentIndex(props.note.instrumentIndex)
        actions.setSelectedFrequency(props.note.frequency)
      }
      return;
    }

    const shouldDeactivate =
      (props.note.active && store.keys.alt) || (
        props.note.active &&
        store.selection.instrumentIndex === props.note.instrumentIndex &&
        props.note.frequency === store.selection.frequency
      )

    props.setNote(
      shouldDeactivate
        ? { active: false }
        : {
            active: true,
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
          active: true,
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
          active: false
        }
      )
    }
  })

  return (
    <button
      onclick={setNote}
      onmousemove={mouseenter}
      onmouseout={mouseout}
      class={`flex-1 flex overflow-auto flex-row ${props.class} items-center`}
    >
      <div
        class={`flex flex-1 h-full relative overflow-hidden rounded-xl hover:bg-selected ${
          props.shouldBlink ? "bg-white" : "bg-black"
        }`}
        style={{
          background: getColor(),
          "min-height": "1rem",
          filter: props.shouldBlink ? "brightness(1.5)" : "",
        }}
      >
        <Show when={props.note.active}>
          <div class="h-full flex-1 self-center flex items-center justify-center text-xs">
            {mton(ftom((props.note as ActiveNote).frequency))}
          </div>
        </Show>
      </div>
    </button>
  )
}
export type Note = NoteType
export default Note
