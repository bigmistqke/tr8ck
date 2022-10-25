import { For } from "solid-js"
import { actions, store } from "../../Store"
import { ButtonWithHoverOutline } from "../UIElements"

const InstrumentSelection = () => {
    return (
      <div class="flex gap-2">
        <div class="grid grid-cols-8 flex-1 gap-2 flex-wrap justify-start">
          <div class="grid grid-cols-7 gap-2 col-span-7">
              <For each={store.instruments}>
                {
                  (instrument, i) => (
                    <ButtonWithHoverOutline
                      class={`w-5 ${
                        store.selection.instrumentIndex === i() 
                      ? "border-4 border-white" 
                        : ""
                      }`  }
                      style={{"background": instrument.active ? instrument.color : "black"}}                     
                      onclick={() => actions.setSelectedInstrumentIndex(i())}
                    >
                      {i()}
                    </ButtonWithHoverOutline>
                  )
                    
                } 
              </For>
            </div>
            
          <ButtonWithHoverOutline
              class="flex-0 bg-white hover:bg-black hover:text-white"
              onclick={actions.addInstrument}
            >
              +
            </ButtonWithHoverOutline>
        </div>

    </div>
        
    )
}
export default InstrumentSelection