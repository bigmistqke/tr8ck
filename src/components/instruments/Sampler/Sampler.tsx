import { batch, createSignal, For, Show } from "solid-js"
import copyArrayBuffer from "../../../utils/copyArrayBuffer"
import fileToArrayBuffer from "../../../utils/fileToArrayBuffer"
import { actions, store } from "../../../Store"
import { Sampler } from "../../../types"
import arrayBufferToWaveform from "../../../waveform/arrayBufferToWaveform"
import { Block, Button, ButtonBar, SliderBar } from "../../UIElements"
import WaveVisualizer from "./WaveVisualizer"



export default () => {
  let input: HTMLInputElement;
  const instrument  = () => actions.getSelectedInstrument() as Sampler;

  const [filesOpened, setFilesOpened] = createSignal(false);

  const uploadFile = async () => {
    if(!store.context) return;
    const file = input.files![0];
    const arrayBuffer = await fileToArrayBuffer(file)
    setFilesOpened(false)
    actions.addToArrayBuffers({arrayBuffer: copyArrayBuffer(arrayBuffer), name: file.name})
    await actions.processSamplerArrayBuffer({arrayBuffer, name: file.name})
  } 

  const SampleList = () => {
    return <div class="flex flex-col flex-1 gap-2 ">
      <div class="flex flex-col flex-1 gap-2 p-2 rounded-xl overflow-auto">
        <For each={store.audioBuffers}>
        {
          ({arrayBuffer, name}) => <div class="flex-0 h-10">
              <Button
              onclick={()=>actions.processSamplerArrayBuffer({arrayBuffer,name})}
              class="h-10 w-full flex shrink-0 justify-center break-all items-center rounded-xl text-2xl cursor-pointer bg-white hover:bg-black hover:text-white"
            >{name}</Button>
            </div>
        }
      </For>
      </div>
      <div class="flex-0 ">
      <Button class="h-10 w-full" onclick={()=>input.click()}>+</Button>
  
      </div>
    </div>
  }

  return (
      <>
        <div class="h-48 flex">
          <Block 
            class="relative flex-1 flex overflow-hidden" 
          >
            <Show when={!filesOpened()} fallback={<SampleList/>}>
              <WaveVisualizer instrument={instrument()} />
            </Show>
          </Block>
          </div>
        
        <div class="flex gap-2">
            <input type="file" ref={input!} oninput={uploadFile} hidden/>
            <ButtonBar onclick={() => {
              if(store.audioBuffers.length > 0)  
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



