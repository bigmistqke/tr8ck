import { For } from "solid-js"
import { actions, store } from "../../Store"
import { Instrument, Inactive, Indices } from "../../types"
import { Button, ButtonWithHoverOutline } from "../UIElements"

const InstrumentSelection = () => {
    return (
        <div class="flex flex-1 gap-2 justify-end">
            <For each={store.instruments}>
              {
                (instrument, i) =>
                  <ButtonWithHoverOutline
                    class={
                      store.selection.instrumentIndex === i() 
                      ? "border-4 border-white" 
                      : "hover:border-4 hover:border-white"
                    }
                    style={{"background": instrument.active ? instrument.color : "black"}}                     
                    onclick={() => actions.setSelectedInstrumentIndex(i())}
                  >
                    {i()}
                  </ButtonWithHoverOutline>
              } 
          </For>
        </div>
    )
}
export default InstrumentSelection