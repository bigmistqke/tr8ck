import { For } from "solid-js"
import { actions, store } from "../../Store"
import { Button } from "../UI_elements"
import FxChain from "./FxChain"

export default () => {

  console.log("TRACKFXCHAIN")

  return (
    <div class="p-2 pt-0 " >
      <div 
        class="flex gap-2 w-full h-4 mb-2 overflow-hidden"
      >
        <For each={store.tracks}>
          {
            (track, index) => (
              <Button 
                class={`${
                  store.selection.trackIndex === index() 
                  ? "bg-black" 
                  : "bg-white"
                } flex-1 h-full`}
                onclick={() => actions.setSelectedTrackIndex(index())}
              />
            )
          }
        </For>
      </div>
      <FxChain 
        fxChain={store.tracks[store.selection.trackIndex].fxChain}
        addToFxChain={(fx)=>console.log("FX!!", fx)}
      />
    </div>
    
  )
}
