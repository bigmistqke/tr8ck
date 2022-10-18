import { batch, createEffect } from "solid-js"
import arrayBufferToWaveform from "../../../waveform/arrayBufferToWaveform"
import fileToArrayBuffer from "../../../helpers/fileToArrayBuffer"
import { actions, setStore, store } from "../../../Store"
import { Sampler } from "../../../types"
import { Button, ButtonBar, SliderBar } from "../../UI_elements"
import WaveVisualizer from "./WaveVisualizer"

const SamplerUI = () => {
  let input: HTMLInputElement;
  const instrument  = () => actions.getSelectedInstrument() as Sampler;

  function copy(src: ArrayBuffer)  {
    var dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
  }

  const uploadFile = () => {
    batch(async () => {
      if(!store.context) return;
      const file = input.files![0];
      const arrayBuffer = await fileToArrayBuffer(file)
      const arrayBuffer2 = copy(arrayBuffer);
      const waveform = await arrayBufferToWaveform(arrayBuffer, store.context)
      actions.setSamplerWaveform(waveform);
      const audioBuffer = await store.context.decodeAudioData(arrayBuffer2)
      actions.setSamplerAudioBuffer(audioBuffer)
      actions.setSamplerSelection("start", 0)
      actions.setSamplerSelection("end", waveform.length)
    })
  } 
  return (
      <>
        <WaveVisualizer instrument={instrument()} />
        <div class="flex gap-2">
            <input type="file" ref={input!} oninput={uploadFile} hidden/>
            <ButtonBar onclick={() => input.click()}>load sample</ButtonBar>
            <ButtonBar onclick={actions.revertSamplerAudiobuffer}>revert sampler</ButtonBar>
            <SliderBar 
              onchange={(value) => actions.setSamplerSpeed(speed => speed + value / 100)}
            >
              speed: {Math.floor(instrument().speed * 100)}%
            </SliderBar>
        </div>
      </>
  )
}
  
export default SamplerUI