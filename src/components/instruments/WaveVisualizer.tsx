import { createEffect, createUniqueId, onCleanup, onMount } from "solid-js"
import cursorEventHandler from "../../helpers/cursorEventHandler";
import WaveDrawer from "../../helpers/WaveDrawer";
import { Waveform } from "../../types";
import { Block } from "../UI_elements";
// import {setCanvas, setWaveform, renderWaveform} from "../../workers/draw.worker"



const WaveVisualizer = (props: {
  waveform?: Waveform
  navigation: {
    start: number
    end: number
  }
  selection: {
    start: number
    end: number
  }
  onmousedown?: (e: MouseEvent) => void
}) => {
  const id = createUniqueId();
  let canvas: HTMLCanvasElement;
  let image: HTMLImageElement;
  let webworker: Worker;
  let drawer: WaveDrawer;

  let timeout: number;

  onMount(()=>{
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    if("transferControlToOffscreen" in canvas){
      webworker = new Worker('/drawer.worker.js');
      // @ts-ignore 
      // canvas.transferControlToOffscreen is an experimental feature
      // https://caniuse.com/mdn-api_htmlcanvaselement_transfercontroltooffscreen
      const offscreenCanvas = canvas.transferControlToOffscreen();
      webworker.postMessage({msg: 'offscreen', canvas: offscreenCanvas}, [offscreenCanvas]);
    }else{
      /* drawer = new WaveDrawer();
      drawer.setCanvas(canvas); */
      console.error("this browser does not support canvas.transferControlToOffscreen which can result in slower performance")
    }
  
    window.addEventListener("resize", onResize);
  })

  onCleanup(()=>{
    window.removeEventListener("resize", onResize)
  })

  createEffect(async ()=>{
    if(!props.waveform) return;
    if(!webworker){
      // drawer.setWaveform(props.waveform);
    }else{
      webworker.postMessage({msg: 'waveform', waveform: props.waveform}, []);
      webworker.postMessage({msg: 'width', width: canvas.offsetWidth}, []);
      webworker.postMessage({msg: 'render', width: canvas.offsetWidth}, []);
    }
  })

  createEffect(async ()=>{
    if(!props.waveform) return;
    if(!webworker){
      // drawer.drawToCanvas(props.navigation.start, props.navigation.end, canvas.offsetWidth);
    }else{
      webworker.postMessage({msg: 'selection', start: props.selection.start, end: props.selection.end}, []);
    }
  })

  createEffect(async ()=>{
    if(!props.waveform) return;
    if(!webworker){
      // drawer.drawToCanvas(props.navigation.start, props.navigation.end, canvas.offsetWidth);
    }else{
      webworker.postMessage({msg: 'navigation', start: props.navigation.start, end: props.navigation.end}, []);
      webworker.postMessage({msg: 'render', width: canvas.offsetWidth}, []);
    }
  })

  const onResize = () => {
    if(!props.waveform) return;
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      if(!props.waveform) return;
      if(webworker)
        webworker.postMessage({msg: 'render', start: props.navigation.start, end: props.navigation.end, width: canvas.offsetWidth}, []);
      else{
        // drawer.drawToCanvas(props.navigation.start, props.navigation.end, canvas.offsetWidth);
      }
    }, 1000/60)
  }



  return (
    <Block 
      class="relative bg-selected flex-1" 
      onwheel={(e) => {console.log("onwheel", e)}}
      onmousedown={props.onmousedown}
    >
      <div class="absolute w-full h-full">
        <div 
          class="absolute h-full w-2 bg-red-500" 
          style={{
            transform: `translateX(${props.selection.start - props.navigation.start}%)`
          }}
          onmousedown={props.onmousedown}
        />
      </div>
      <canvas 
        id={id} 
        ref={canvas!} 
        class="flex-1 pt-5 pb-5"
      ></canvas>
    </Block>
  )
}

export default WaveVisualizer