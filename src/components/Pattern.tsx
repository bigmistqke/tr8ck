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
    <div 
      class="flex flex-1" 
      style={{"min-width": "50px"}}
    >
      <div class="flex flex-1 flex-col gap-2 mt-2">
        <For each={seq}>
          {
            (el, index) => 
              <Note 
                setNote={(note: NoteType) => setSeq(index(), note)}
                note={seq[index()]}
                shouldBlink={store.clock % seq.length === index()}
                class={(((index() + 1) / 4) % 1 === 0 && index() < props.amount - 1) ? "mb-4" : ""}
              />
          }
        </For>
      </div>
    </div>
  )
}

const TinyPattern = (props: {
  amount: number
  onclick: (index: number) => void
  // sequence: NoteType[]
}) => {
  // const [seq, setSeq] = createStore<NoteType[]>(props.sequence)

  return (
    <div 
      class="flex flex-0" 
      // style={{"min-width": "50px"}}
    >
      <div class="flex flex-0 w-4 flex-col gap-2 mt-2">
        <For each={new Array(props.amount).fill(0)}>
          {
            (el, index) => 
            <button
                onclick={() => props.onclick(index())}
                class={`flex-1 flex overflow-auto flex-row items-center ${
                  (((index() + 1) / 4) % 1 === 0 && index() < props.amount - 1) ? "mb-4" : ""
                }`}
            >
                <div 
                    class={`flex flex-1 h-full relative overflow-hidden rounded-xl hover:bg-white ${
                      store.clock % props.amount === index() ? "bg-white" : "bg-black"
                    }`}
                    style={{
                      // background: getColor(), 
                      "min-height": "1.75rem",
                      filter: store.clock % props.amount === index() ? "brightness(1.5)" : ""}}
                >
                    {/* <Show when={props.note.active}>
                        <div class="h-full flex-1 self-center flex items-center justify-center text-xs">
                            {mton(ftom((props.note as ActiveNote).frequency))}
                        </div>
                    </Show> */}
                </div>
            
            </button>
          }
        </For>
      </div>
    </div>
  )
}

export {TinyPattern}
