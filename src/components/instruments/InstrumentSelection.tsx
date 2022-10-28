import { For } from "solid-js"
import { actions, store } from "../../Store"
import { AddButton, ButtonWithHoverOutline } from "../UIElements"

const InstrumentSelection = () => {
    return (
      <div class="flex gap-2">
        <div 
          class="grid grid-cols-8 flex-1 gap-2 flex-wrap justify-start overflow-y-auto"
          style={{"max-height": "calc(1.5rem * 4)"}}
        >
          <div 
            class="grid grid-cols-7 gap-2 col-span-7" 
          >
            <For each={store.instruments}>
              {
                (instrument, i) => (
                  <ButtonWithHoverOutline
                    // class={`${
                    //   store.selection.instrumentIndex === i() 
                    // ? "border-4 border-white" 
                    //   : ""
                    // }`  }
                    selected={store.selection.instrumentIndex === i()}
                    style={{"background": instrument.color}}                     
                    onclick={() => actions.setSelectedInstrumentIndex(i())}
                  >
                    {i()}
                  </ButtonWithHoverOutline>
                )
                  
              } 
            </For>
          </div>
          <AddButton onclick={actions.addInstrument} class={"sticky top-0"}/>          
        </div>

    </div>
        
    )
}
export default InstrumentSelection