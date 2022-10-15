import { createEffect, onCleanup, onMount, Show } from "solid-js"
import  { Faust } from "faust2webaudio"

import { setupAudio } from "./setupAudio"
import {  ROOT_FREQUENCY } from "./constants"
import {store, setStore, actions} from "./Store"


import Piano from "./components/Piano"
import InstrumentUI from "./components/instruments/Instrument"
import MicroMacro from "./components/MicroMacro"

import "./App.css"
import { Instrument } from "./types"


function App() {

  let clockInterval:number;

  onMount(async () => {
    const faust = new Faust({
      wasmLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.wasm",
      dataLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.data",
    })
    await faust.ready

    const { context, audioSource } = await setupAudio()

    setStore("faust", faust)
    setStore("context", context)

    await actions.initInstruments(context.destination)

    clockInterval = setInterval(() => {
      setStore("clock", (c) => c + 1);
      actions.render()
    }, 100)

    const root = document.documentElement;
    const [i,j] = store.selection.instrumentIndices;
    const instrument = store.instruments[i][j];
    root.style.setProperty('--selected-color', (instrument as Instrument).color);

    initKeyboard();

    return () => context.close()
  })

  onCleanup(() => {
    clearInterval(clockInterval)
    store.context?.close()
  })

  createEffect(()=>{
    const [i,j] = store.selection.instrumentIndices;
    const instrument = store.instruments[i][j]
    if("color" in instrument){
      const root = document.documentElement;
      root.style.setProperty('--selected-color', (instrument as Instrument).color)
    }
  })

  const initKeyboard = () => {
    window.onkeydown = (e) => {
      switch(e.code){
        case "ShiftLeft":
          setStore("keys", "shift", true);
        case "ShiftRight":
          setStore("keys", "shift", true);
      }
    }
    window.onkeyup = (e) => {
      switch(e.code){
        case "ShiftLeft":
          setStore("keys", "shift", false);
        case "ShiftRight":
          setStore("keys", "shift", false);
      }
    }
  }

  return (
    <div class="flex flex-1 bg-slate-200" style={{"filter": "var(--modal-filter)"}}>
      <div class="flex flex-1 h-full">
        <Piano
          frequency={store.selection.frequency}
          setKey={(key) => setStore("selection", "frequency", Math.floor(ROOT_FREQUENCY *  Math.pow(Math.pow(2, 1/12), key)))}
        />
        <MicroMacro/>
      </div>
      <div class="flex flex-1 flex-col h-full p-2 gap-4">
        <InstrumentUI />
      </div>
  </div>
  )
}

export default App
