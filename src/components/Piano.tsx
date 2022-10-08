import { For } from "solid-js"
import { ROOT_FREQUENCY } from "../constants"

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
    const isKeySelected = (key: number) => {
      const frequency = Math.floor(ROOT_FREQUENCY *  Math.pow(Math.pow(2, 1/12), key))
      return props.frequency === frequency 
    }
    return <div class="flex flex-col w-32 mr-2">
      <For each={new Array(12 * 6).fill(0)}>
        {
          (_,index) => <div class="flex flex-1">
            <button 
              class={`flex-1 relative bg-${notes[index() % 12]} ${isKeySelected(index()) ? "bg-selected" : "hover:bg-selected"}`}
              onclick={() => props.setKey(index())}
            >
            </button>
          </div>
        }
      </For>
    </div>
  }