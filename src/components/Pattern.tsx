import { For } from "solid-js"
import { createStore } from "solid-js/store"
import { store } from "../Store"
import Note, { Note as NoteType } from "./Note"

export default (props: {
  amount: number
  sequence: NoteType[]
}) => {
  const [seq, setSeq] = createStore<NoteType[]>(props.sequence)

  return (
    <div class="flex flex-1">
      <div class="flex flex-1 flex-col gap-2 mt-2">
        <For each={seq}>
          {
            (el, index) => 
              <Note 
                setNote={(note: NoteType) => setSeq(index(), note)}
                note={seq[index()]}
                shouldBlink={store.clock % seq.length === index()}
                class={((index() + 1) / 4) % 1 === 0 ? "mb-4" : ""}
              />
          }
        </For>
      </div>
    </div>
  )
}
