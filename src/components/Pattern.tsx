import { Faust } from "faust2webaudio"
import { For } from "solid-js"
import { createStore } from "solid-js/store"
import Note, { Note as NoteType } from "./Note"
import { Instrument, Indices } from "../types"
import { store } from "../Store"

export default (props: {
  amount: number
  sequence: NoteType[]
}) => {
  const [seq, setSeq] = createStore<NoteType[]>(props.sequence)

  return (
    <div class="flex flex-1">
      <div class="flex flex-1 flex-col gap-2">
        <For each={seq}>
          {
            (el, index) => 
              <Note 
                setNote={(note: NoteType) => setSeq(index(), note)}
                note={seq[index()]}
                shouldBlink={store.clock % seq.length === index()}
              />
          }
        </For>
      </div>
    </div>
  )
}
