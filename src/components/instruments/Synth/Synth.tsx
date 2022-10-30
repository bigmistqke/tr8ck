import { createSignal, Switch, Match, Show, For, onMount, onCleanup, createUniqueId, createEffect, createMemo, untrack } from "solid-js"
import {  createStore, produce } from "solid-js/store"
import { Portal } from "solid-js/web"
import { actions, setStore, store } from "../../../Store";
import { FaustElement, Synth as SynthType } from "../../../types"
import {Block, Button} from "../../UIElements";
import zeptoid from "zeptoid"
import randomColor from "../../../utils/randomColor";
import CodeMirror from "../../../libs/codemirror6/CodeMirror";
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
  const [error, setError] = createSignal<string | undefined>(undefined);

  const processCode = async (code?: string ) => {
    let c = code || (container.querySelector(".cm-content") as HTMLElement).innerText
    c = c.replaceAll(/\n\n/g, "\n") 
    actions.setInstrument(store.selection.instrumentIndex, produce((instrument) => (instrument as SynthType).code = c))
    const result = await actions.compileFaust(c);
    
    if(!result.success){
      setError(result.error)
      return result;
    }else{
      setError(undefined);
    }

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
    return result;
  }

  const openEditor = () => {
    actions.addToEditors({
      id: zeptoid(),
      code: () => props.instrument.code, 
      compile: async (code) => {
        // const result = actions.compileFaust(code)
        const result = await processCode(code)
        return result!;
      }
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
    <div class="flex flex-1 flex-col gap-2">
      <div 
        class="flex flex-col h-48"
        ref={container!}
      >
        <Switch>
          <Match when={listOpened()}>
            <SynthList 
              setCode={(code)=>{
                setListOpened(false) 
                if(code){
                  // setCode(code);
                  processCode(code);
                }else{
                    console.error("code or title is undefined", code)
                }
              }}
            />
          </Match>
          <Match when={!listOpened()}>
            <CodeMirror 
              code={() => props.instrument.code}
              class={"h-full"}
              error={error()}
              containerClass="flex flex-col h-full"
            />
          </Match>
        </Switch>
      </div>

      <div class="flex gap-2 h-6" >
        <Button onclick={e => processCode()}>
          compile
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
          extraClass={`relative flex gap-2 h-24 p-2 bg-white whitespace-nowrap overflow-x-auto`}
        >
          <Fx state={props.instrument.elements[0]} disableOnOff={true}/>
        </Block>              
      </Show>
    </div>
  </>)
}

export default Synth;