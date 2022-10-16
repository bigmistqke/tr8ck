import { batch, createEffect, createSignal, createUniqueId, onCleanup, onMount } from "solid-js"
import cursorEventHandler from "../../helpers/cursorEventHandler";
import WaveDrawer from "../../helpers/WaveDrawer";
import { actions, store } from "../../Store";
import { Sampler, Waveform } from "../../types";
import { Block } from "../UI_elements";
import WaveSelection from "./WaveSelection";
// import {setCanvas, setWaveform, renderWaveform} from "../../workers/draw.worker"



const WaveVisualizer = (props: {
  instrument: Sampler
}) => {
  const id = createUniqueId();
  let canvas: HTMLCanvasElement;
  let webworker: Worker;
  let drawer: WaveDrawer;

  let timeout: number;

  const init = () => {
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
  
    window.addEventListener("resize", resize);
  }

  const cleanup = () => {
    window.removeEventListener("resize", resize)
  }

  const initWaveform = async ()=>{
    if(!props.instrument.waveform) return;
    if(!webworker){
      // drawer.setWaveform(props.instrument.waveform);
    }else{
      console.log('waveform is ', props.instrument.waveform);
      webworker.postMessage({msg: 'waveform', waveform: JSON.parse(JSON.stringify(props.instrument.waveform))}, []);
      webworker.postMessage({msg: 'width', width: canvas.offsetWidth}, []);
      webworker.postMessage({msg: 'render', width: canvas.offsetWidth}, []);
    }
  }

  const clearCanvasIfWaveformIsUndefined = () => {
    if(props.instrument.waveform) return;
    if(!webworker){
      // drawer.drawToCanvas(props.instrument.navigation.start, props.instrument.navigation.end, canvas.offsetWidth);
    }else{
      webworker.postMessage({msg: 'clear'}, []);
    }
  }

  const navigateWaveform = async () => {
    if(!props.instrument.waveform) return;
    if(!webworker){
      // drawer.drawToCanvas(props.instrument.navigation.start, props.instrument.navigation.end, canvas.offsetWidth);
    }else{
      webworker.postMessage({msg: 'navigation', start: props.instrument.navigation.start, end: props.instrument.navigation.end}, []);
      webworker.postMessage({msg: 'render', width: canvas.offsetWidth}, []);
    }
  }

  onMount(init)
  onCleanup(cleanup)

  createEffect(initWaveform)
  createEffect(clearCanvasIfWaveformIsUndefined)
  createEffect(navigateWaveform)

  const resize = () => {
    if(!props.instrument.waveform) return;
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      if(!props.instrument.waveform) return;
      if(webworker)
        webworker.postMessage({msg: 'render', start: props.instrument.navigation.start, end: props.instrument.navigation.end, width: canvas.offsetWidth}, []);
      else{
        // drawer.drawToCanvas(props.navigation.start, props.navigation.end, canvas.offsetWidth);
      }
    }, 1000/60)
  }

  const mousedown = (e: MouseEvent) => {
    if(store.keys.shift || e.button === 1){
      e.preventDefault();
      let x: number, y: number;
      let deltaX: number, deltaY: number;
      cursorEventHandler(({clientX, clientY}) => {
        if(x && y){
          const {start, end} = props.instrument.navigation;

          deltaX = (x - clientX) * 10;
          deltaY = (y - clientY) * 20;
    
          let startX = start + deltaX;
          let endX = startX < 0 ? end : end - deltaX;
          startX = endX <= 0 ? start : Math.max(0, startX);
          batch(()=>{
            actions.setSamplerNavigation("start", Math.max(0, startX + deltaY))
            actions.setSamplerNavigation("end", Math.max(0, endX + deltaY))
          })
        }
        x = clientX;
        y = clientY;
      })
    }    
  }


  return (
    <div class="h-64 flex">
      <Block 
        class="relative bg-selected flex-1" 
        onwheel={(e) => {console.log("onwheel", e)}}
        onmousedown={mousedown}
      >
        <canvas 
          id={id} 
          ref={canvas!} 
          class="flex-1 pt-5 pb-5 max-w-full"
        />
        <WaveSelection 
          canvas={canvas!} 
          instrument={props.instrument}
        />
      </Block>
    </div>
  )
}

export default WaveVisualizer