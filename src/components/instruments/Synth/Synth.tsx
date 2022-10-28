import { createSignal, Switch, Match, Show, For, onMount, onCleanup, createUniqueId, createEffect, createMemo, untrack } from "solid-js"
import {  createStore, produce } from "solid-js/store"
import { Portal } from "solid-js/web"
import { actions, setStore, store } from "../../../Store";
import { FaustElement, Synth as SynthType } from "../../../types"
import {Block, Button} from "../../UIElements";
import zeptoid from "zeptoid"
import randomColor from "../../../utils/randomColor";
import CodeMirror from "../../../codemirror6/CodeMirror";
import FxPool from "../../Fx/FxPool";
import FxChain from "../../Fx/FxChain";
import Fx from "../../Fx/Fx";
import SynthList from "./SynthList";
import SynthSaveModal from "./SynthSaveModal";




const Synth = (props: {
  instrument: SynthType
}) => {
  let container: HTMLDivElement

  const [listOpened, setListOpened] = createSignal(false)
  const [codeTitle, setCodeTitle] = createSignal("default")
  const [saveMenuOpened, setSaveMenuOpened] = createSignal(false);
  const [synth, setSynth] = createStore(props.instrument)

  const setCode = (code?: string) => {
    code = code || (container.querySelector(".cm-content") as HTMLElement).innerText
    actions.setInstrument(store.selection.instrumentIndex, produce((instrument) => (instrument as SynthType).code = code))
    return code;
  }

  const processCode = async () => {
    const code = setCode();

    if(!store.context || !code) return;

    const result = await actions.compileFaust(code);

    

    if(!result.success) return;

    const factory = actions.createFactory(result.dsp, zeptoid());

    

    const elements = (await Promise.all(
      store.tracks.map(track => 
        actions.createFaustElementFromFaustFactory({
          factory,
          id: zeptoid(),
          active: true,
          parameters: actions.getParametersFromDsp(result.dsp)
        })
      )
    )) as FaustElement[]

    props.instrument.elements?.forEach(element => {
      element?.node.disconnect();
    })

    actions.setSelectedInstrument("elements", elements);
  }

  const openEditor = () => {
    actions.addToEditors({
      id: zeptoid(),
      code: props.instrument.code, 
      compile: (code) => actions.compileFaust(code)
    })
  }

  const parameterValues = createMemo(() => props.instrument.elements[0]?.parameters.map(({value}) => value))

  createEffect(() => {
    const elements = props.instrument.elements
    if(elements.length === 0) return;
    
    const values = parameterValues();

    untrack(() => {
      elements[0].parameters.forEach((parameter, parameterIndex) => {

        elements.forEach((element, index) => {
          if(index === 0) return;
          const newValue = values[parameterIndex]
          const parameter = element.parameters[parameterIndex];
          if(parameter.value === newValue) return;
          const [_, setParameter] = createStore(parameter);
          setParameter("value",  newValue)
          element.node.setParamValue(parameter.address, newValue);
        })
      })
    })
    

  })

  return (
  <>
      <Show when={saveMenuOpened()}>
          <SynthSaveModal setSaveMenuOpened={setSaveMenuOpened} codeTitle={codeTitle()} code={props.instrument.code}/>
      </Show>
      <div class="flex flex-1 flex-col gap-2">
          <Switch>
              <Match when={listOpened()}>
                  <SynthList 
                    setCode={(code)=>{
                      // console.log("")
                      setListOpened(false) 
                      if(code){
                        setCode(code);
                        processCode();
                      }else{
                          console.error("code or title is undefined", code)
                      }
                    }}
                  />
                  
              </Match>
              <Match when={!listOpened()}>
                  <div 
                    class="flex flex-col h-48 rounded-xl overflow-auto"
                    ref={container!}
                  >
                    <CodeMirror 
                      code={props.instrument.code}
                      class={"h-full"}
                    />
                  </div>
              </Match>
          </Switch>
          <div class="flex gap-2 h-6" >
            <Button onclick={processCode}>
              compile
            </Button>
            <Button onclick={()=>setSaveMenuOpened(true)}>
              save as
            </Button>
            <Button onclick={() => setListOpened(bool => !bool)}>
              {!listOpened() ? "open" : "close"} list
            </Button>
            <Button 
              onclick={openEditor}>
              window
            </Button>
          </div>
          
          <Show when={props.instrument.elements[0]} >
            <Block 
              class={`relative flex gap-2 h-24 p-2 bg-white whitespace-nowrap overflow-x-auto ${props.class}`}
            >
              <Fx state={props.instrument.elements[0]} disableOnOff={true}/>
            </Block>              
          </Show>
          {/* <FxChain fxChain={[]} createNodeAndAddToFxChain={() => {}} compilingIds={[]}/> */}
      </div>
  </>)
}

export default Synth;