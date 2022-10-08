import { createEffect, For, onMount, Show } from "solid-js"
import { createStore } from "solid-js/store"

import "./App.css"
import { setupAudio } from "./setupAudio"

import Faust2WebAudio, { Faust } from "faust2webaudio"
import Piano from "./components/Piano"
import { INSTRUMENT_AMOUNT, ROOT_FREQUENCY, SEQUENCE_AMOUNT, SEQUENCE_LENGTH } from "./constants"
import { Inactive, Indices, Instrument, Note } from "./types"
import InstrumentUI from "./components/InstrumentUI"
import InstrumentSelection from "./components/InstrumentSelection"
import MicroMacro from "./components/MicroMacro"
import {store, setStore, actions} from "./Store"
import randomColor from "./helpers/randomColor"


const defaultCode = `import("stdfaust.lib");
bubble(f0,trig) = os.osc(f) * (exp(-damp*time) : si.smooth(0.99))
  with {
    damp = 0.043*f0 + 0.0014*f0^(3/2);
    f = f0*(1+sigma*time);
    sigma = eta * damp;
    eta = 0.075;
    time = 0 : (select2(trig>trig'):+(1)) ~ _ : ba.samp2sec;
  };

process = t : g * bubble(hslider("freq", 600, 150, 2000, 1));

g = t,1 : min;
t = button("drop");
`

function App() {
    // const [store, setStore] = useStore();

 /*  const [store, setStore] = createStore<{
    clock: number
    faust?: Faust
    context?: AudioContext
    selectedFrequency: number
    selectedInstrumentIndices: Indices
    sequences: Note[][]
    instruments: (Instrument | Inactive)[][]
  }>({
    clock: -1,
    faust: undefined,
    context: undefined,
    selectedFrequency: 554,
    selectedInstrumentIndices: [0,0],
    sequences: Array(SEQUENCE_AMOUNT)
      .fill(0)
      .map(() =>
        Array(SEQUENCE_LENGTH)
          .fill(0)
          .map(() => ({
            active: false
      }))
    ),
    instruments: Array(INSTRUMENT_AMOUNT)
      .fill(0)
      .map(() =>
        Array(INSTRUMENT_AMOUNT)
          .fill(0)
          .map(() => ({active: false})
      )
    ),
  }) */

  const initInstruments = async (destination: AudioDestinationNode) => {
    for(let i = 0; i < INSTRUMENT_AMOUNT; i++){
      for(let j = 0; j < INSTRUMENT_AMOUNT; j++){
        const node = await actions.getNode(defaultCode)
        if(!node) return
        // let hue = (i / (INSTRUMENT_AMOUNT - 1))* 50 + (j / (INSTRUMENT_AMOUNT - 1)) * 200;
        setStore("instruments", i, j, {
          active: true,
          type: "synth",
          code: defaultCode,
          node: undefined,
          color: randomColor()
        })
        createEffect(async () => {
          const instrument = store.instruments[i][j]
          if("code" in instrument) {
            const node = await actions.getNode(instrument.code)
            if(!node) {
              setStore("instruments", i, j, "error", "can not compile")
              return
            }

            node.connect(destination)
            if(instrument.node)
              instrument.node.disconnect();
            setStore("instruments", i, j, "node", node)
            setStore("instruments", i, j, "error", undefined)
          }
        })
      }
    }
  }

  onMount(async () => {
    const faust = new Faust({
      wasmLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.wasm",
      dataLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.data",
    })
    await faust.ready

    const { context, audioSource } = await setupAudio()

    setStore("faust", faust)
    setStore("context", context)

    await initInstruments(context.destination)
    setInterval(() => {
      setStore("clock", (c) => c + 1);
      actions.render()
    }, 100)

    const root = document.documentElement;
    const [i,j] = store.selectedInstrumentIndices;
    const instrument = store.instruments[i][j]
    root.style.setProperty('--selected-color', (instrument as Instrument).color)

    return () => context.close()
  })


  createEffect(()=>{
    const [i,j] = store.selectedInstrumentIndices;
    const instrument = store.instruments[i][j]
    if("color" in instrument){
      const root = document.documentElement;
      root.style.setProperty('--selected-color', (instrument as Instrument).color)
    }
  })

  return (
    <div class="flex flex-1 bg-slate-200" style={{"filter": "var(--modal-filter)"}}>
      
      <div class="flex flex-1 h-full">
        <Piano
          frequency={store.selectedFrequency}
          setKey={(key) => setStore("selectedFrequency", Math.floor(ROOT_FREQUENCY *  Math.pow(Math.pow(2, 1/12), key)))}
        />
        <MicroMacro/>
      </div>
      <div class="flex flex-1 flex-col h-full p-2 gap-4">
        <Show when={actions.getSelectedInstrument().active}>
            <InstrumentUI />
            <InstrumentSelection
              instruments={store.instruments}
              selectInstrument={(i, j) => setStore("selectedInstrumentIndices", [i, j])}
              selectedInstrumentIndices={store.selectedInstrumentIndices}
            />
        </Show>
        
      </div>
      
  </div>
  )
}

export default App
