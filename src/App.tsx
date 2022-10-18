import { createEffect, onCleanup, onMount } from "solid-js"
import {store, setStore, actions} from "./Store"

import Piano from "./components/Piano"
import InstrumentUI from "./components/instruments/Instrument"
import Patterns from "./components/Patterns"

import { Instrument } from "./types"
import mtof from "./helpers/mtof"

import "./App.css"
import bpmToMs from "./helpers/bpmToMs"
import Composition from "./components/Composition"
import FxEditor from "./components/Fx/FxEditor"



function App() {

  // console.log("faust is ", window.faust_module)

  let lastTime = performance.now();
  let spb, c;
  const clock = () => {
    requestAnimationFrame(clock);
    spb = 1000 / (store.bpm / 60 * 4)

    const c = Math.floor((performance.now() - store.clockOffset) / bpmToMs(store.bpm));
    // c = Math.floor((performance.now() - store.clockOffset)/ spb);
    // console.log(c);

    if(c > store.clock){
      // console.log(performance.now() - lastTime);
      lastTime = performance.now();

      setStore("clock", c);
      actions.renderAudio();
    }
  }

  const setSelectedColorCSS = () => {
    const [i,j] = store.selection.instrumentIndices;
    const instrument = store.instruments[i][j]
    if("color" in instrument){
      const root = document.documentElement;
      root.style.setProperty('--selected-color', (instrument as Instrument).color)
    }
  }

  const initContext = async () => {
    // actions.initContext();
    window.removeEventListener("mousedown", initContext)
    await actions.initFaust()
    await actions.initInstruments()
    await actions.initTracks()
    actions.initKeyboard();
  }

  const initApp = async () => {
    const root = document.documentElement;
    root.style.setProperty('--selected-color', actions.getSelectedInstrument().color);
    
    // actions.initContext()
    await actions.initFaust()
    await actions.initFx()
    await actions.initInstruments()
    await actions.initTracks()
    actions.initKeyboard();

    clock();

    // window.addEventListener("mousedown", initContext)
  }

  const cleanup = () => {
    store.context?.close()
  }

  onMount(initApp)
  onCleanup(cleanup)
  createEffect(setSelectedColorCSS)

  return (
    <div class="flex flex-1 bg-neutral-300" style={{"filter": "var(--modal-filter)"}}>
      <div class="flex flex-1 h-full">
        <Piano
          frequency={store.selection.frequency}
          setKey={(key) => setStore("selection", "frequency", mtof(key))}
        />
        <Patterns/>
      </div>
      <div class="flex flex-1 h-full p-2 gap-2">
        <Composition/>
        <div class="flex flex-col flex-1 pl-2 pr-2 gap-2 w-96">
          <InstrumentUI/>
          <FxEditor/>
        </div>
      </div>
  </div>
  )
}

export default App
