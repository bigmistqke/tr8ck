import {Button, ButtonBar, SliderBar} from "./UI_elements"
import { actions, store } from "../Store"
import { For } from "solid-js"
import Pattern from "./Pattern"
import FxChain from "./Fx/FxChain"

export default () => {
    return (
      <div class="flex-1 flex flex-col w-96">
        <div class="flex gap-2 pb-0 p-2">
            <ButtonBar onclick={actions.incrementSelectedPatternId} style={{background: actions.getPatternColor(store.selection.patternId)}}>
                pattern #{store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)}
            </ButtonBar>
            <SliderBar 
              class="bg-white select-none cursor-e-resize text-center" 
              onchange={(delta, timespan) => actions.setBPM(bpm => bpm + delta, timespan)}
            >
              bpm: {store.bpm}
            </SliderBar>
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
        <div class="p-2 pt-0 " >
          <div class="flex gap-2 w-full h-4 mb-2 overflow-hidden">
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
            addToFxChain={actions.addToFxChainTrack}
          />
        </div>
    </div>
  )
}