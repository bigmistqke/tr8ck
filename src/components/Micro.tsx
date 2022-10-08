import { For } from "solid-js"
import { actions, store } from "../Store"
import Sequence from "./Sequence"
import { Button } from "./UI_elements"

const Micro = () => {
    return <div class="m-2 flex-1 flex flex-col gap-2">
{/*         <div class="flex gap-2">
            <Button onclick={actions.incrementSelectedPattern} style={{background: actions.getPatternColor(store.selectedPatternId)}}>
                {store.bpm}BPM
            </Button>
            <Button onclick={actions.toggleTrackMode}>open</Button>
            <Button onclick={actions.toggleTrackMode}>save</Button>
        </div> */}
        <div class="flex-1 flex gap-2 overflow-hidden">
            <For each={actions.getSelectedPattern()?.sequences}>
                {
                sequence => 
                    <Sequence
                        amount={sequence.length}
                        sequence={sequence}
                    />
                }
            </For>
        </div> 
    </div>
}

export default Micro