import {Bar, ButtonBar} from "./UI_elements"
import { actions, store } from "../Store"
import FXs from "./FXs"
import { For } from "solid-js"
import Pattern from "./Pattern"

export default () => {
    return (
      <div class="flex-1 flex flex-col w-96">
        <div class="flex gap-2 pb-0 p-2">
            <ButtonBar onclick={actions.incrementSelectedPattern} style={{background: actions.getPatternColor(store.selection.patternId)}}>
                pattern #{store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)}
            </ButtonBar>
            <Bar>bpm: {store.bpm}</Bar>
            <ButtonBar onclick={actions.copySelectedPattern}>copy</ButtonBar>
            <ButtonBar onclick={actions.clearSelectedPattern}>clear</ButtonBar>
            <ButtonBar onclick={actions.clearSelectedPattern}>automate</ButtonBar>
        </div>
        <div class="m-2 flex-1 flex flex-col gap-2">
          <div class="flex-1 flex gap-2 overflow-hidden">
            <For each={actions.getSelectedPattern()?.sequences}>
              {
                sequence => 
                  <Pattern
                    amount={sequence.length}
                    sequence={sequence}
                  />
              }
            </For>
          </div> 
        </div>
        <FXs/>
    </div>
  )
}