import { Faust } from "faust2webaudio"
import { For } from "solid-js"
import { Indices, Instrument, Note } from "../types"
import {Button, Block} from "./UI_elements"
import Sequence from "./Sequence"
import { actions, store } from "../Store"

const Pattern = () => {
    return <div class="flex-1 flex flex-col">
        <div class="flex-1 flex gap-2 m-2">
            <For each={actions.getSelectedPattern()}>
                {
                sequence => 
                    <Sequence
                        amount={sequence.length}
                        sequence={sequence}
                    />
                }
            </For>
        </div>
        <div class="flex gap-4 p-2">
            <Button onclick={actions.incrementSelectedPattern}>#{store.selectedPattern}</Button>
            <Button onclick={actions.toggleTrackMode}>{store.trackMode}</Button>
            <Button onclick={actions.copySelectedPattern}>copy</Button>
            <Button onclick={actions.clearSelectedPattern}>clear</Button>
        </div>
    </div>
}

export default Pattern