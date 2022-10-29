import { createEffect, For, onCleanup, onMount, Show } from "solid-js"
import { actions, store } from "./Store"

import InstrumentUI from "./components/instruments/Instrument"
import Matrix from "./components/Matrix"
import Piano from "./components/Piano"

import { Instrument } from "./types"
import mtof from "./utils/mtof"

import Composition from "./components/Composition/Composition"
import FxPool from "./components/Fx/FxPool"

import EditorModal from "./components/EditorModal"
import { Bar, ButtonBar } from "./components/UIElements"

import { TiMediaPause, TiMediaPlay, TiMediaRecord, TiMediaRecordOutline, TiMediaStop } from 'solid-icons/ti'
import { TbMicrophone } from 'solid-icons/tb'


import ContextMenu from "./components/ContextMenu"

function App() {
  const setSelectedColorCSS = () => {
    const instrument = actions.getSelectedInstrument();
    const pattern = actions.getSelectedPattern();
    const root = document.documentElement;
  
    if("color" in instrument){
      root.style.setProperty('--selected-instrument', (instrument as Instrument).color)
    }
    
    if(pattern && "color" in pattern){
      const root = document.documentElement;
      root.style.setProperty('--selected-pattern', pattern.color)
    }
  }

  const initApp = async () => {
    const root = document.documentElement;
    root.style.setProperty('--selected-instrument', actions.getSelectedInstrument().color);
    
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

  const dragover = (e: DragEvent) => {
    e.preventDefault(); 
    return false
  }

  const drop = (e:DragEvent) => {
    e.preventDefault(); 
    
    if (e.dataTransfer?.items) {
      const item = e.dataTransfer.items[0];
      if(!item) return;
      if (item.kind !== 'file') return;
       
      const file = item.getAsFile();
      if(!file) return;

      const splitFilename = file.name.split(".")
      if(splitFilename[splitFilename.length - 1] === "sprint"){

        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          if(!event.target){
            console.error("event.target is undefined")
          }else{
            actions.openLocalSet(JSON.parse(event.target.result))
          }
        });
        reader.readAsText(file);

      }else{
        if(actions.getSelectedInstrument().type !== "sampler")
          actions.setTypeSelectedInstrument("sampler")
  
        actions.uploadAudioFile(file);
      }
    }
    return false
  }

  return (<>
    <For each={store.editors}>
      {
        (editor) => <EditorModal {...editor}/>
      }
    </For>
    <Show when={store.contextmenu}>
      <ContextMenu {...store.contextmenu!}/>
    </Show>
    <div 
      class="flex flex-1 bg-neutral-200" 
      style={{"filter": "var(--modal-filter)"}}
      ondragover={dragover}
      ondrop={drop}
    >
      <div class="flex flex-1 h-full">
        <div class="flex flex-col gap-2 p-2">
          <div class="flex-0">
            <Bar extraClass="bg-white flex gap-2 transition-colors">
              <button 
                class={`h-4 hover:text-red-500 transition-colors ${store.audioRecorder && store.audioRecorder.type === "resample" ? "animate-record" : ""}`}
                onclick={() => actions.recordAudio("resample")}
                title="render to sampler 👉 shift+r"
              >
                <TiMediaRecordOutline class="h-4 w-4" />
              </button>
              <button 
                class={`h-4 hover:text-red-500 transition-colors ${store.audioRecorder  && store.audioRecorder.type === "file" ? "animate-record" : ""}`} 
                onclick={() => actions.recordAudio("file")}
                title="render to file 👉 alt+r"
              >
                <TiMediaRecord class="h-4 w-4" />
              </button>
              <button 
                class={`h-4 hover:text-red-500 transition-colors ${store.audioRecorder  && store.audioRecorder.type === "mic" ? "animate-record" : ""}`} 
                onclick={() => actions.recordAudio("mic")}
              >
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
              setKey={(key) => actions.setSelectedFrequency(mtof(key))}
            />
          <div class="flex-0">
            <ButtonBar 
              extraClass="flex-1 w-full"
              onclick={actions.saveLocalSet}
            >
              save
            </ButtonBar>
          </div>
        </div>
        <Matrix/>
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
