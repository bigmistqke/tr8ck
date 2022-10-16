import { createEffect, onCleanup, onMount, Show } from "solid-js"
import  { Faust } from "faust2webaudio"

import { getWebAudioMediaStream } from "./getWebAudioMediaStream"
import {  ROOT_FREQUENCY } from "./constants"
import {store, setStore, actions} from "./Store"


import Piano from "./components/Piano"
import InstrumentUI from "./components/instruments/Instrument"
import MicroMacro from "./components/MicroMacro"

import "./App.css"
import { Instrument } from "./types"
import mtof from "./helpers/mtof"


function App() {
  const clock = () => {
    requestAnimationFrame(clock);
    const c = Math.floor((performance.now() - store.clockOffset) / (60 / store.bpm * 1000 / 4));
    if(c > store.clock){
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

  const initApp = async () => {
    const root = document.documentElement;
    root.style.setProperty('--selected-color', actions.getSelectedInstrument().color);
    
    actions.initContext()
    await actions.initFaust()
    await actions.initInstruments()
    await actions.initTracks()
    actions.initKeyboard();

    clock();
  }

  const cleanup = () => {
    store.context?.close()
  }

  onMount(initApp)
  onCleanup(cleanup)
  createEffect(setSelectedColorCSS)

  return (
    <div class="flex flex-1 bg-slate-200" style={{"filter": "var(--modal-filter)"}}>
      <div class="flex flex-1 h-full">
        <Piano
          frequency={store.selection.frequency}
          setKey={(key) => setStore("selection", "frequency", mtof(key))}
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
