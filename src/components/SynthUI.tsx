import { createSignal, Switch, Match, Show, For, onMount, onCleanup, createUniqueId } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { Portal } from "solid-js/web"
import { actions, setStore, store } from "../Store";
import { Synth, Indices, Instrument, Inactive } from "../types"
import {Button} from "./UI_elements";

function allStorage() {
    var entries = [],
        keys = Object.keys(localStorage),
        i = keys.length;

    while ( i-- ) {

        if(keys[i].startsWith("SYNTH_")){
            entries.push([keys[i], localStorage.getItem(keys[i])] );
        }/* else{
            localStorage.removeItem(keys[i])
        } */
    }

    return entries;
}


const SynthList = (props: {setCode: (code: string | null, title: string | null) => void}) => {
    return <div
        class={`flex flex-col gap-4 h-96 overflow-auto align-center bg-gray-300 rounded-xl p-4`}
    >
        <For each={allStorage()}>
            {
                ([title,code]) => <button
                    class="h-16 w-full flex shrink-0 justify-center items-center rounded-xl text-2xl cursor-pointer bg-white hover:bg-black hover:text-white"
                    onclick={() => props.setCode(code, title)}
                >{title?.replace("SYNTH_", "")}</button>
            }
        </For>
    </div>
}

const SaveModal = (props: {setSaveMenuOpened: (boolean: boolean) => void, codeTitle: string, code: string }) => {

    let codeTitleRef: HTMLInputElement
    let closeMenuRef: HTMLDivElement

    const id = createUniqueId();

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
                console.log(e.target);
                if(e.target === closeMenuRef)
                    props.setSaveMenuOpened(false)  
            }}
        >
            <div class="flex flex-col w-3/6 h-32 absolute z-10 inset-1/2 bg-white -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-xl">
                <div class="flex flex-1 items-center justify-center text-center text-2xl bg-gray-400 text-white">
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


 const SynthUI = (props: {
    instrument: Synth
  }) => {
    let textarea: HTMLTextAreaElement

    const [listOpened, setListOpened] = createSignal(false)
    const [codeTitle, setCodeTitle] = createSignal("default")

    const [saveMenuOpened, setSaveMenuOpened] = createSignal(false);

    const setCode = (code: string) => {
        const [i,j] = store.selectedInstrumentIndices
        actions.setInstrument(i,j, produce((instrument) => (instrument as Synth).code = code))
    }

    return (
      <>
        <div class="flex flex-1 flex-col gap-4">
            <div class="h-16 flex  text-black text-xl gap-4">
                <div class={`flex flex-1 items-center rounded-2xl ${ props.instrument.active ? "bg-selected" : "" }`}>
                    <span class="flex-1 text-center">
                        {store.selectedInstrumentIndices[0]} : {store.selectedInstrumentIndices[1]}
                    </span>
                </div>
                <div class="flex flex-1 items-center rounded-2xl  bg-white">
                    <span class="flex-1 text-center ">{props.instrument.type.toUpperCase()}</span>
                </div>
                </div>
                <Show when={saveMenuOpened()}>
                    <SaveModal setSaveMenuOpened={setSaveMenuOpened} codeTitle={codeTitle()} code={props.instrument.code}/>
                </Show>
                <div class="flex flex-1 flex-col gap-4">
                    <Switch>
                    <Match when={listOpened()}>
                        <SynthList 
                            setCode={(code,title)=>{
                                if(code && title){
                                    setCode(code);
                                    setCodeTitle(title)
                                }else{
                                    console.error("code or title is undefined", code, title)
                                }
                                setListOpened(false)  
                            }}
                        />
                        
                    </Match>
                    <Match when={!listOpened()}>
                        <div class="flex flex-col gap-4 h-96">
                            <textarea
                                value={props.instrument.code}
                                ref={textarea!}
                                class={`flex-1 font-mono bg-gray-300 overflow-auto text-black p-5 rounded-2xl ${props.instrument.error ? "border-red-500" : ""}`}
                                spellcheck={false}
                            />
                        </div>
                    </Match>
                </Switch>
                    
                <div class="flex gap-4">
                    <Button onclick={() => !textarea || setCode(textarea.value)}>
                        compile
                    </Button>
                    <Button onclick={() => setListOpened(bool => !bool)}>
                        {!listOpened() ? "open" : "close"}
                    </Button>
                    <Button onclick={()=>setSaveMenuOpened(true)}>
                        save
                    </Button>
                </div>
            </div>
        </div>
      </>
    )
  }

  export default SynthUI;