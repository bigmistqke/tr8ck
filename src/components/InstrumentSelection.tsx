import { For } from "solid-js"
import { Instrument, Inactive, Indices } from "../types"

const InstrumentSelection = (props: {
    instruments: (Instrument | Inactive)[][]
    selectInstrument: (i: number, j: number) => void
    selectedInstrumentIndices: Indices
  }) => {
    const isSelected = (indices: Indices) => props.selectedInstrumentIndices[0] === indices[0] && props.selectedInstrumentIndices[1] === indices[1] 
    const getColor = (instrument: Instrument | Inactive, indices: Indices, isSelected: boolean) => {
      if(instrument.active){
        if(isSelected){
          return `hsl(${instrument.hue}, 75%, 50%`
        }
        return `hsl(${instrument.hue}, 50%, 50%`
      }
      return "black"
    }
    return (
        <div class="flex flex-1 gap-4">
            <For each={props.instruments}>
                {(row, i) => (
                <div class="flex flex-1 flex-col gap-4">
                    <For each={row}>
                    {(instrument, j) => 
                    { 
                        return <button
                            onclick={() => props.selectInstrument(i(), j())}
                            class={`flex-1 flex` }
                        >
                            <div 
                            class={`flex flex-1 h-full  rounded-2xl justify-center items-center text-2xl ${isSelected([i(), j()]) ? "border-8 border-white" : "hover:border-8 hover:border-white"}`}
                            style={{"background": getColor(instrument, [i(), j()], isSelected([i(), j()]))}}                      
                            >
                            <span>
                                {i()} : {j()}
                            </span>
                            </div>
                        </button>
                        }
                    }
                    </For>
                </div>
                )}
          </For>
        </div>
    )
}
export default InstrumentSelection