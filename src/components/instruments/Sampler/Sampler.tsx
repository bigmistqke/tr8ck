import { batch, createEffect, createSignal, For, Show } from "solid-js"
import copyArrayBuffer from "../../../utils/copyArrayBuffer"
import fileToArrayBuffer from "../../../utils/fileToArrayBuffer"
import { actions, store } from "../../../Store"
import { Sampler } from "../../../types"
import arrayBufferToWaveform from "../../../waveform/arrayBufferToWaveform"
import { Block, Button, ButtonBar, SliderBar } from "../../UIElements"
import WaveVisualizer from "./WaveVisualizer"
import SamplerList from "./SamplerList"



export default () => {
  let input: HTMLInputElement;
  const instrument  = () => actions.getSelectedInstrument() as Sampler;

  const [filesOpened, setFilesOpened] = createSignal(false);

  createEffect(() => {
    
  })

  const onInput = (e: InputEvent) => {
    const file = input.files![0];
    actions.uploadAudioFile(file)
    setFilesOpened(false);
  }

  return (
      <>
        <div class="h-48 flex">
          <Block 
            class="relative flex-1 flex overflow-hidden" 
          >
            <Show when={!filesOpened()} fallback={<SamplerList input={input!} setFilesOpened={setFilesOpened}/>}>
              <WaveVisualizer instrument={instrument()} />
            </Show>
          </Block>
          </div>
        
        <div class="flex gap-2">
            <input type="file" ref={input!} oninput={onInput} hidden/>
            <ButtonBar onclick={() => {
              if(store.arrayBuffers.length > 0)  
               setFilesOpened(bool => !bool);
              else
                input.click();
            }}>load</ButtonBar>
            <ButtonBar onclick={actions.cloneSelectedInstrument}>clone</ButtonBar>
            <ButtonBar onclick={actions.revertSamplerAudiobuffer}>revert</ButtonBar>
            <SliderBar 
              onupdate={(value) => actions.setSamplerSpeed(speed => speed + value / 100)}
            >
              speed: {Math.floor(instrument().speed * 100)}%
            </SliderBar>
        </div>
      </>
  )
}



