import { createEffect, createSignal, startTransition } from "solid-js"
import { createStore, SetStoreFunction } from "solid-js/store"
import WaveformData from "waveform-data"
import arrayBufferToWaveform from "../../helpers/arrayBufferToWaveform"
import cursorEventHandler from "../../helpers/cursorEventHandler"
import fileToArrayBuffer from "../../helpers/fileToArrayBuffer"
import { actions, store } from "../../Store"
import { Sampler, Waveform } from "../../types"
import { Bar, Block, Button } from "../UI_elements"
import WaveVisualizer from "./WaveVisualizer"

const SamplerUI = () => {
  let input: HTMLInputElement;
  const instrument  = () => actions.getSelectedInstrument() as Sampler;

  const [waveform, setWaveform] = createSignal<Waveform>();
  // let setInstrument : SetStoreFunction<Sampler>;
  // const [file, setFile] = createSignal<File>()

  const uploadFile = async () => {
    if(!store.context) return;
    const file = input.files![0];
    console.log('file is')
    // setFile(file);
    const arrayBuffer = await fileToArrayBuffer(file)
    const waveform = await arrayBufferToWaveform(arrayBuffer, store.context)
    setWaveform(waveform);
  }

  createEffect(()=>{
    console.log("this happened");
    // [, setInstrument] = createStore<Sampler>(instrument() )
  })

  const mousedown = (e: MouseEvent) => {
    if(store.keys.shift){
      let x: number, y: number;
      let deltaX: number, deltaY: number;
      cursorEventHandler(({clientX, clientY}) => {
        if(x && y){
          const {start, end} = instrument().navigation;

          deltaX = (x - clientX) * 10;
          deltaY = (y - clientY) * 20;
    
          let startX = start + deltaX;
          let endX = startX < 0 ? end : end - deltaX;
          startX = endX <= 0 ? start : Math.max(0, startX);

          actions.setNavigationSampler("start", Math.max(0, startX + deltaY))
          actions.setNavigationSampler("end", Math.max(0, endX + deltaY))
        }
        x = clientX;
        y = clientY;
      })
    }else{
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const left = (e.clientX - rect.left) / rect.width * 100;

      console.log("left", left);

      actions.setSelectionSampler("start", left)
      // actions.setSelectionSampler("end", Math.max(0, endX + deltaY))
    }


    
  }

  return (
      <>
        <div 
          onmousedown={() => {console.log("mousedown")}}
          class="h-64 flex"
        >
          <WaveVisualizer 
            waveform={waveform()} 
            onmousedown={mousedown}
            navigation={instrument().navigation}
            selection={instrument().selection}
          />

        </div>
        <div class="flex gap-5">
            <input type="file" ref={input!} oninput={uploadFile} hidden/>
            <Button onclick={()=>{
              console.log(input)
              input.click()
            }}>load sample</Button>
            <Bar>start {instrument().navigation.start}</Bar>
            <Bar>end {instrument().navigation.end}</Bar>
        </div>
      </>
  )
}
  
export default SamplerUI