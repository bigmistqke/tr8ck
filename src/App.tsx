import { createEffect, For, onCleanup, onMount, Show } from "solid-js"
import { actions, setStore, store } from "./Store"

import InstrumentUI from "./components/instruments/Instrument"
import Patterns from "./components/Patterns"
import Piano from "./components/Piano"

import { Instrument } from "./types"
import mtof from "./utils/mtof"

import "./App.css"
import Composition from "./components/Composition"
import FxPool from "./components/Fx/FxPool"

import FaustCodeEditor from "./components/FaustCodeEditor"
import { Bar } from "./components/UIElements"

import { TiMediaPause, TiMediaPlay, TiMediaRecord, TiMediaRecordOutline, TiMediaStop } from 'solid-icons/ti'
import { TbMicrophone, TbMicrophone2 } from 'solid-icons/tb'

function App() {


  

  const setSelectedColorCSS = () => {
    const instrument = actions.getSelectedInstrument();
    if("color" in instrument){
      const root = document.documentElement;
      root.style.setProperty('--selected-color', (instrument as Instrument).color)
    }
  }

/*   const initContext = async () => {
    // actions.initContext();
    window.removeEventListener("mousedown", initContext)
    await actions.initFaust()
    await actions.initInstruments()
    await actions.initTracks()
    actions.initKeyboard();
  }
 */
  const initApp = async () => {
    const root = document.documentElement;
    root.style.setProperty('--selected-color', actions.getSelectedInstrument().color);
    
    actions.initContext()
    await actions.initFaust()
    await actions.initFx()
    await actions.initInstruments()
    await actions.initTracks()
    actions.initClock()
    actions.initKeyboard();
  }

  const cleanup = () => {
    store.context?.close()
  }

  onMount(initApp)
  onCleanup(cleanup)
  createEffect(setSelectedColorCSS)

  return (<>
    <For each={store.editors}>
      {
        (editor) => <FaustCodeEditor {...editor}/>
      }
    </For>
    <div class="flex flex-1 bg-neutral-200" style={{"filter": "var(--modal-filter)"}}>
      <div class="flex flex-1 h-full">
        <div class="flex flex-col">
          <div class="flex-0 p-2">
            <Bar class="bg-white flex gap-2 transition-colors">
              {/* <button class="inline-block bg-black rounded-xl w-4 h-4 margin-auto align-middle"/> */}
              <button 
                class={`h-4 hover:text-red-500 transition-colors ${store.audioRecorder && !store.audioRecorder.toFile ? "animate-record" : ""}`}
                onclick={() => actions.recordAudio(false)}
                title="render to sampler 👉 shift+r"
              >
                <TiMediaRecordOutline class="h-4 w-4" />
              </button>
              <button 
                class={`h-4 hover:text-red-500 transition-colors ${store.audioRecorder?.toFile ? "animate-record" : ""}`} 
                onclick={() => actions.recordAudio(true)}
                title="render to file 👉 alt+r"
              >
                <TiMediaRecord class="h-4 w-4" />
              </button>
              <button class=" h-4 hover:text-red-500 transition-colors" onclick={actions.resetPlaying}>
                <TbMicrophone   class="h-4 w-4"/>
              </button>
              <button 
                class="h-4 hover:text-red-500 transition-colors" 
                onclick={actions.togglePlaying}
                title="play/pause 👉 space"
              >
                <Show when={!store.bools.playing} fallback={
                  <TiMediaPause class="h-4 w-4" />
                }>
                  <TiMediaPlay class="h-4 w-4" />
                </Show>
              </button>
              <button 
                class=" h-4 hover:text-red-500 transition-colors" 
                onclick={actions.resetPlaying}
                title="stop"
              >
                <TiMediaStop class="h-4 w-4" />
              </button>
              
            </Bar>
          </div>
          <Piano
              frequency={store.selection.frequency}
              setKey={(key) => setStore("selection", "frequency", mtof(key))}
            />
          
        </div>
        
        <Patterns/>
      </div>
      <div class="flex flex-1 h-full p-2 gap-2">
        <Composition/>
        <div class="flex flex-col flex-1 pl-2 pr-2 gap-2 w-96">
          <InstrumentUI/>
          <FxPool/>
        </div>
      </div>
    </div>
  </>
    
  )
}

export default App
