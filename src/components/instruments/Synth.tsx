import { createSignal, Switch, Match, Show, For, onMount, onCleanup, createUniqueId, createEffect } from "solid-js"
import {  produce } from "solid-js/store"
import { Portal } from "solid-js/web"
import { actions, setStore, store } from "../../Store";
import { FaustElement, Synth as SynthType } from "../../types"
import {Block, Button} from "../UIElements";
import zeptoid from "zeptoid"
import randomColor from "../../utils/randomColor";
import CodeMirror from "../../codemirror6/CodeMirror";
import FxPool from "../Fx/FxPool";
import FxChain from "../Fx/FxChain";
import Fx from "../Fx/Fx";

function allStorage() {
    var entries = [],
        keys = Object.keys(localStorage),
        i = keys.length;

    while ( i-- ) {
        if(keys[i].startsWith("SYNTH_")){
            entries.push([keys[i], localStorage.getItem(keys[i])] );
        }
    }

    return entries;
}


const SynthList = (props: {setCode: (code: string | null, title: string | null) => void}) => {
    return <div
        class={`flex flex-col gap-4 h-48 overflow-auto align-center bg-white rounded-xl p-4`}
    >
        <For each={allStorage()}>
            {
                ([title,code]) => <button
                    class="h-16 w-full flex shrink-0 justify-center items-center rounded-xl text-2xl cursor-pointer bg-white hover:bg-black hover:text-white"
                    onclick={() => props.setCode(code, title)}
                    style={{background: randomColor()}}
                >{title?.replace("SYNTH_", "")}</button>
            }
        </For>
    </div>
}

const SaveModal = (props: {setSaveMenuOpened: (boolean: boolean) => void, codeTitle: string, code: string }) => {

    let codeTitleRef: HTMLInputElement
    let closeMenuRef: HTMLDivElement

    const id = zeptoid();

    const addToStorage =(e) => {
        e.preventDefault();
        const name = "SYNTH_" + codeTitleRef.value
        window.localStorage.setItem(name, props.code);
        props.setSaveMenuOpened(false);
    }

    onMount(()=>{
        document.documentElement.style.setProperty("--modal-filter", "blur(15px)")  
    })

    onCleanup(()=>{
        document.documentElement.style.setProperty("--modal-filter", "");
    })

    return <Portal>
        <div 
            ref={closeMenuRef!}
            class="absolute top-0 left-0 z-10 w-full h-full " onclick={(e)=>{
                if(e.target === closeMenuRef)
                  props.setSaveMenuOpened(false)  
            }}
        >
            <div class="flex flex-col w-3/6 h-48 absolute z-10 inset-1/2 bg-white -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-xl">
                <div class="flex flex-1 items-center justify-center text-center text-2xl bg-white text-white">
                    <span>save your patch</span>
                </div>
                <div class="flex flex-1">
                    <form onsubmit={addToStorage} class="pl-4 flex-1" id={id}>
                        <input 
                            ref={codeTitleRef!} 
                            type="text" 
                            placeholder="enter name effect" 
                            class="h-full text-2xl w-full ml-4"
                            value={props.codeTitle.replace("SYNTH_", "")}
                        />
                    </form>
                    <button class="mr-4 ml-4" type="submit" form={id} value="Submit">submit</button>
                </div>
            </div>
        </div>
    </Portal>
}


 const Synth = (props: {
    instrument: SynthType
  }) => {
    let container: HTMLDivElement
    let textarea: HTMLTextAreaElement

    const [listOpened, setListOpened] = createSignal(false)
    const [codeTitle, setCodeTitle] = createSignal("default")
    const [saveMenuOpened, setSaveMenuOpened] = createSignal(false);

    const [faustElement, setFaustElement] = createSignal();


    const setCode = async () => {
      const code = (container.querySelector(".cm-content") as HTMLElement).innerText
      // const code = textarea.value

      actions.setInstrument(store.selection.instrumentIndex, produce((instrument) => (instrument as SynthType).code = code))
      setNode();
    }

    const setNode = async () => {
      console.log("this happens?")
      const code = props.instrument.code
      if(!store.context || !code) return;


      const dsp = await actions.compileFaust(code);
      if(!dsp) return;
      const factory = actions.createFactory(dsp)

      // const node = await actions.createFaustNode(dsp)

      const element = await actions.createFaustElementFromFaustFactory({
        factory,
        id: zeptoid(),
        active: true,
        parameters: actions.getParametersFromDsp(dsp)
      });

      if(!element) return;

      if(!element.node) {
        actions.setSelectedInstrument("error", "can not compile")
        return
      }

      if(props.instrument.element?.node)
          props.instrument.element?.node.disconnect();

      actions.setSelectedInstrument("element", element)
      actions.setSelectedInstrument("error", undefined)
      setFaustElement(element)
    }

    return (
    <>
        <Show when={saveMenuOpened()}>
            <SaveModal setSaveMenuOpened={setSaveMenuOpened} codeTitle={codeTitle()} code={props.instrument.code}/>
        </Show>
        <div class="flex flex-1 flex-col gap-2">
            <Switch>
                <Match when={listOpened()}>
                    <SynthList 
                        setCode={(code,title)=>{
                            if(code && title){
                                setNode(code);
                                setCodeTitle(title)
                            }else{
                                console.error("code or title is undefined", code, title)
                            }
                            setListOpened(false)  
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
            <div class="flex gap-2 h-8">
                <Button onclick={setCode}>
                  compile
                </Button>
                <Button onclick={()=>setSaveMenuOpened(true)}>
                  save as
                </Button>
                <Button onclick={() => setListOpened(bool => !bool)}>
                  {!listOpened() ? "open" : "close"} list
                </Button>
                <Button 
                  onclick={() => actions.addToEditors({
                      id: zeptoid(),
                      code: props.instrument.code, 
                      oncompile: (dsp) => {
                        console.log(dsp)
                      }
                    })
                  }
                  >
                  window
                </Button>
            </div>
            
            <Show when={props.instrument.element}>
              <Block 
                class={`relative flex gap-2 h-24 p-2 bg-white whitespace-nowrap overflow-x-auto overflow-y-hidden ${props.class}`}
              >
                <Fx state={props.instrument.element}/>
              </Block>              
            </Show>
            {/* <FxChain fxChain={[]} createNodeAndAddToFxChain={() => {}} compilingIds={[]}/> */}
        </div>
    </>)
  }

  export default Synth;