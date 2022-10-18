import { For } from "solid-js"
import { actions, store } from "../../Store"
import { Instrument, Inactive, Indices } from "../../types"
import { Button, ButtonWithHoverOutline } from "../UI_elements"

const InstrumentSelection = () => {
    const isSelected = (indices: Indices) => {
      const [i, j] = store.selection.instrumentIndices;
      return i === indices[0] && j === indices[1]
    } 
    return (
        <div class="flex flex-col flex-1 gap-2 justify-end">
            <For each={store.instruments}>
                {(row, i) => (
                <div class="flex gap-2">
                    <For each={row}>
                    {
                        (instrument, j) => 
                            (
                              <ButtonWithHoverOutline
                                class={
                                  isSelected([i(), j()]) 
                                  ? "border-4 border-white" 
                                  : "hover:border-4 hover:border-white"
                                }
                                style={{"background": instrument.active ? instrument.color : "black"}}                     
                                onclick={() => actions.setSelectedInstrumentIndices(i(), j())}
                              >
                                {i()} : {j()}
                              </ButtonWithHoverOutline>
                            )
                    }
                    </For>
                </div>
                )}
          </For>
        </div>
    )
}
export default InstrumentSelection