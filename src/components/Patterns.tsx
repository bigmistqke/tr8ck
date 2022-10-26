import {Button, ButtonBar, ButtonWithHoverOutline, SliderBar} from "./UIElements"
import { actions, store } from "../Store"
import { For } from "solid-js"
import Pattern, { TinyPattern } from "./Pattern"
import FxChain from "./Fx/FxChain"
import { SEQUENCE_LENGTH, TRACK_AMOUNT } from "../constants"

export default () => {
    return (
      <div class="flex-1 flex flex-col w-96" >
        <div class="flex gap-2 pb-0 p-2 overflow-auto" style={{
          "scrollbar-gutter": "stable"
        }}>
            <SliderBar 
              class="bg-white select-none cursor-e-resize text-center" 
              onupdate={(delta, timespan) => actions.setBPM(bpm => bpm + delta, timespan)}
            >
              bpm {store.bpm}
            </SliderBar>
            <SliderBar 
              class="bg-white select-none cursor-e-resize text-center" 
              onupdate={(delta, timespan) => actions.setBPM(bpm => bpm + delta, timespan)}
            >
              stp {SEQUENCE_LENGTH}
            </SliderBar>
            <SliderBar 
              class="bg-white select-none cursor-e-resize text-center" 
              onupdate={(delta, timespan) => actions.setBPM(bpm => bpm + delta, timespan)}
            >
              trx {TRACK_AMOUNT}
            </SliderBar>
            <ButtonWithHoverOutline onclick={actions.incrementSelectedPatternId} style={{background: actions.getPatternColor(store.selection.patternId)}}>
                #{store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)}
            </ButtonWithHoverOutline>   
            <ButtonBar onclick={actions.copySelectedPattern}>clone</ButtonBar>
            <ButtonBar onclick={actions.clearSelectedPattern}>clear</ButtonBar>
            <ButtonBar onclick={actions.clearSelectedPattern}>auto</ButtonBar>
        </div>
        <div class="pl-2 pr-2 mt-1 mb-2 flex-1 flex-col gap-2 overflow-auto" style={{
          "scrollbar-gutter": "stable"
        }}>
          <div class="flex-1 flex gap-2 min-h-full">
            <For each={actions.getSelectedPattern()?.sequences}>
              {
                (sequence, index) => 
                  <Pattern
                    amount={sequence.length}
                    sequence={sequence}
                    active={
                      store.solos.length === 0 || store.solos.includes(index())
                    }
                  />
              }
            </For>
            <TinyPattern
              amount={SEQUENCE_LENGTH}
              onclick={actions.setClock}
            />
          </div> 
        </div>
        <div class="p-2 pt-0 " >
          <div class="flex gap-2 w-full h-4 mb-2 overflow-hidden pr-6" style={{
          "scrollbar-gutter": "stable"
        }}>
            <For each={store.tracks}>
              {
                (track, index) => (<div class="flex gap-1 flex-1">
                  <div class="flex flex-0  w-4 p-0.5">
                    <Button 
                        class={`flex-1 ${
                          store.solos.includes(index()) 
                            ? "bg-black" 
                            : "bg-white"
                        }`}
                        title="solo"
                        onclick={() => actions.toggleTrackSolo(index())}
                      />
                  </div>
                  <Button 
                      class={`${
                        store.selection.trackIndex === index() 
                        ? "bg-black" 
                        : "bg-white"
                      } flex-1 h-full`}
                      onclick={() => actions.setSelectedTrackIndex(index())}
                    />
                </div>
                )
              }
            </For>
          </div>
          <FxChain 
            fxChain={actions.getSelectedTrack().fxChain}
            createNodeAndAddToFxChain={actions.createNodeAndAddToFxChainTrack}
            removeNodeFromFxChain={actions.removeNodeFromFxChainTrack}
            compilingIds={actions.getSelectedTrack().compilingIds}
            updateOrder={actions.updateOrderFxChainTrack}
          />
        </div>
    </div>
  )
}