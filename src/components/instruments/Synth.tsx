import { createSignal, Switch, Match, Show, For, onMount, onCleanup, createUniqueId, createEffect } from "solid-js"
import {  produce } from "solid-js/store"
import { Portal } from "solid-js/web"
import { actions, setStore, store } from "../../Store";
import { Synth as SynthType } from "../../types"
import {Button} from "../UI_elements";
import zeptoid from "zeptoid"
import randomColor from "../../helpers/randomColor";

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
        class={`flex flex-col gap-4 h-96 overflow-auto align-center bg-white rounded-xl p-4`}
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
            <div class="flex flex-col w-3/6 h-32 absolute z-10 inset-1/2 bg-white -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-xl">
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
    let textarea: HTMLTextAreaElement

    const [listOpened, setListOpened] = createSignal(false)
    const [codeTitle, setCodeTitle] = createSignal("default")

    const [saveMenuOpened, setSaveMenuOpened] = createSignal(false);

    const setCode = async (code: string) => {
        const [i,j] = store.selection.instrumentIndices
        actions.setInstrument(i,j, produce((instrument) => (instrument as SynthType).code = code))
    }

    const setNode = async (code: string) => {
        const [i,j] = store.selection.instrumentIndices
        const node = await actions.getNode(code)

        if(!node) {
          setStore("instruments", i, j, "error", "can not compile")
          return
        }

        if(store.context)
            node.connect(store.context.destination)
        if(props.instrument.node)
            props.instrument.node.disconnect();
        setStore("instruments", i, j, "node", node)
        setStore("instruments", i, j, "error", undefined)
    }

    createEffect(() => {
        if(store.context && props.instrument.code)
            setNode(props.instrument.code);
    })

    


    return (
    <>
        <Show when={saveMenuOpened()}>
            <SaveModal setSaveMenuOpened={setSaveMenuOpened} codeTitle={codeTitle()} code={props.instrument.code}/>
        </Show>
        <div class="flex flex-1 flex-col gap-4">
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
                    <div class="flex flex-col gap-4 h-96 rounded-2xl overflow-hidden">
                        <textarea
                            value={props.instrument.code}
                            ref={textarea!}
                            class={`flex-1 font-mono bg-white overflow-auto text-black p-5  ${props.instrument.error ? "border-red-500" : ""}`}
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
    </>)
  }

  export default Synth;