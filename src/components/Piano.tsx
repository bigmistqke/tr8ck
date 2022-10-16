import { For } from "solid-js"
import { ROOT_FREQUENCY } from "../constants"
import mtof from "../helpers/mtof"

export default function(props: {frequency: number, setKey: (key: number) => void}){
    const notes = [
      "white", 
        "black", 
      "white",
        "black",
      "white",
      "white",
        "black",
      "white",
        "black",
      "white",
        "black",
      "white"
    ]
    const isKeySelected = (midi: number) => {
      const frequency = mtof(midi)
      return props.frequency === frequency 
    }
    return <div class="flex flex-col w-32 mr-2">
      <For each={new Array(12 * 6).fill(0)}>
        {
          (_,index) => <div class="flex flex-1">
            <button 
              class={`flex-1 relative bg-${notes[index() % 12]} ${isKeySelected(index() + 36) ? "bg-selected" : "hover:bg-selected"}`}
              onclick={() => props.setKey(index() + 36)}
            >
            </button>
          </div>
        }
      </For>
    </div>
  }