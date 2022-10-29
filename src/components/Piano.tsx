import { For } from "solid-js"
import { ROOT_FREQUENCY } from "../constants"
import mtof from "../utils/mtof"

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
    return <div class="flex flex-col flex-1 w-32 flex-col-reverse rounded-xl overflow-hidden">
      <For each={new Array(12 * 6).fill(0)}>
        {
          (_,index) => <div class="flex flex-1">
            <button 
              class={`flex-1 relative bg-${notes[index() % 12] === "white" ? "white" : "neutral-900"} ${isKeySelected(index() + 12 * 1) ? "bg-selected-instrument" : "hover:bg-selected-instrument"}`}
              onclick={() => props.setKey(index() +  12 * 1)}
            />
          </div>
        }
      </For>
    </div>
  }