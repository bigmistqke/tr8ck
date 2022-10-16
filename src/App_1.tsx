import { createEffect, createSignal, For, onMount } from "solid-js"
import { createStore } from "solid-js/store"

import "./App.css"
import { setupAudio } from "./getWebAudioMediaStream"

import Faust2WebAudio, { Faust } from "faust2webaudio"
const code = `
import("stdfaust.lib");

bubble(f0,trig) = os.osc(f) * (exp(-damp*time) : si.smooth(0.99))
	with {
		damp = 0.043*f0 + 0.0014*f0^(3/2);
		f = f0*(1+sigma*time);
		sigma = eta * damp;
		eta = 0.075;
		time = 0 : (select2(trig>trig'):+(1)) ~ _ : ba.samp2sec;
	};

process = button("drop") : bubble(hslider("v:bubble/freq", 600, 150, 2000, 1)) /* <: dm.freeverb_demo */;
`

const Sequence = (props: {
  clock: number
  amount: number
  faust?: Faust
  context?: AudioContext
  pan: number
}) => {
  let textarea: HTMLTextAreaElement | undefined

  const [seq, setSeq] = createStore<{ on: boolean; frequency: number }[]>(
    new Array(props.amount).fill(0).map(() => ({ on: false, frequency: 2000 }))
  )

  const [faustNode, setFaustNode] =
    createSignal<Faust2WebAudio.FaustScriptProcessorNode>()

  const [code, setCode] = createSignal(`
    import("stdfaust.lib");
    bubble(f0,trig) = os.osc(f) * (exp(-damp*time) : si.smooth(0.99))
      with {
        damp = 0.043*f0 + 0.0014*f0^(3/2);
        f = f0*(1+sigma*time);
        sigma = eta * damp;
        eta = 0.075;
        time = 0 : (select2(trig>trig'):+(1)) ~ _ : ba.samp2sec;
      };
    
    process = button("drop") : bubble(hslider("v:bubble/freq", 600, 150, 2000, 1));
  `)

  // let faustNode: Faust2WebAudio.FaustScriptProcessorNode

  createEffect(async () => {
    if (!props.faust || !props.context) return

    setFaustNode(
      await props.faust.getNode(code(), {
        audioCtx: props.context,
        useWorklet: false,
        args: { "-I": "libraries/" },
      })
    )
    const panner = new StereoPannerNode(props.context, { pan: props.pan })

    panner.connect(props.context.destination)
    faustNode()!.connect(panner)


  })
  createEffect(() => {
    if (!faustNode()) return
    if (seq[props.clock % seq.length].on) {
      faustNode()!.setParamValue(
        "/FaustDSP/bubble/freq",
        1000 + Math.random() * 250
      )
      faustNode()!.setParamValue("/FaustDSP/drop", props.clock)
    }
  })

  return (
    <div class="flex flex-1">
      <div class="flex flex-1">
        <For each={seq}>
          {(el, index) => (
            <button
              onclick={() => setSeq(index(), "on", (b) => !b)}
              class={`flex-1 border-black border-2 ${
                props.clock % seq.length === index()
                  ? "bg-white"
                  : seq[index()].on
                  ? "bg-red-500"
                  : "bg-black"
              } ${seq[index()].on ? "" : "hover:bg-gray-500"}`}
            />
          )}
        </For>
      </div>
      <div class="flex flex-col w-96">
        <textarea
          value={code()}
          ref={textarea}
          class="border-black border-2 p-5 font-mono flex-1 bg-black text-white hover:bg-gray-200 hover:text-black"
          spellcheck={false}
        />
        <button
          onclick={() => !textarea || setCode(textarea.value)}
          class="bg-black text-white hover:bg-white hover:text-black h-16"
        >
          submit
        </button>
      </div>
    </div>
  )
}

function App() {
  const [store, setStore] = createStore<{
    clock: number
    faust?: Faust
    context?: AudioContext
    amount: number
  }>({
    clock: 0,
    faust: undefined,
    context: undefined,
    amount: 16,
  })

  onMount(async () => {
    const faust = new Faust({
      wasmLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.wasm",
      dataLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.data",
    })
    await faust.ready

    const { context, audioSource } = await setupAudio()

    setStore("faust", faust)
    setStore("context", context)

    return () => context.close()
  })

  setInterval(() => setStore("clock", (c) => c + 1), 100)

  return (
    <div class="h-full flex flex-col">
      <Sequence
        amount={store.amount}
        clock={store.clock}
        faust={store.faust}
        context={store.context}
        pan={-0.5}
      />
      <Sequence
        amount={store.amount}
        clock={store.clock}
        faust={store.faust}
        context={store.context}
        pan={0.5}
      />
      <Sequence
        amount={store.amount}
        clock={store.clock}
        faust={store.faust}
        context={store.context}
        pan={-1}
      />
      <Sequence
        amount={store.amount}
        clock={store.clock}
        faust={store.faust}
        context={store.context}
        pan={1}
      />
    </div>
  )
}

export default App
