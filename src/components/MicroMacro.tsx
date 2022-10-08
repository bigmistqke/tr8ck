import { Faust } from "faust2webaudio"
import { For, Match, Switch } from "solid-js"
import { Indices, Instrument, Note } from "../types"
import {Button, Block} from "./UI_elements"
import Sequence from "./Sequence"
import { actions, store } from "../Store"
import { DragDropProvider, DragDropSensors } from "@thisbeyond/solid-dnd"
import Macro from "./Macro"
import Micro from "./Micro"

const MicroMacro = () => {
    return <div class="flex-1 flex flex-col">
        {/* <div class="flex-1 flex gap-2 m-2 overflow-hidden"> */}
            <Switch>
                <Match when={store.trackMode === "micro"}>
                    <Micro/>
                </Match>
                <Match when={store.trackMode === "macro"}>
                    <Macro/>
                </Match>
            </Switch>
           
        {/* </div> */}
        <div class="flex gap-2 p-2 pt-0">
            <Button onclick={actions.incrementSelectedPattern} style={{background: actions.getPatternColor(store.selectedPatternId)}}>
                #{store.patterns.findIndex(pattern => pattern.id === store.selectedPatternId)}
            </Button>
            <Button onclick={actions.toggleTrackMode}>{store.trackMode}</Button>
            <Button onclick={actions.copySelectedPattern}>copy</Button>
            <Button onclick={actions.clearSelectedPattern}>clear</Button>
        </div>
    </div>
}

export default MicroMacro