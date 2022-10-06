import { createEffect, Show } from "solid-js"
import { actions, store } from "../Store"
import { Indices, ActiveNote, Note as NoteType} from "../types"

const Note = (props: {
    setNote: ((note: Note) => void)
    note: Note
    shouldBlink: boolean
}) => {
    createEffect(()=>{
    if(props.shouldBlink && props.note.active){
        actions.playNote(props.note.instrumentIndices, props.note.frequency)
    }
    })


    const getColor = () => {
        if(!props.note.active) 
            return ""
        if(props.shouldBlink)
            return  `hsl(${actions.getHueInstrument(props.note.instrumentIndices)}, 100%, 50%)`
        return `hsl(${actions.getHueInstrument(props.note.instrumentIndices)}, 50%, 50%)` 
    }

    const compareIndices = (a: [number,number], b: [number, number]) => a[0] === b[0] && a[1] === b[1]

    const setNote = () => {

        const shouldDeactivate = 
            props.note.active && compareIndices(store.selectedInstrumentIndices, props.note.instrumentIndices) && 
            props.note.frequency === store.selectedFrequency

        props.setNote( 
            shouldDeactivate ? 
            ({active: false}) : 
            ({active: true, frequency: store.selectedFrequency, instrumentIndices: store.selectedInstrumentIndices})
        );
    }

    return <button
        onclick={setNote}
        class={`flex-1 flex flex-row `}
    >
        <div 
            class={`flex flex-1 h-full relative overflow-hidden rounded-xl hover:bg-selected ${
                props.shouldBlink ? "bg-white" : "bg-black"
            }`}
            style={{background: getColor()}}
        >
            <Show when={props.note.active}>
                <div class="h-full flex-1 self-center flex items-center justify-center">
                    {(props.note as ActiveNote).instrumentIndices.join(" : ")}
                </div>
                <div class="h-full flex-1 self-center flex items-center justify-center" style={{background: "rgba(250,250,250,0.125)"}}>
                    {(props.note as ActiveNote).frequency.toFixed(0)}
                </div>
            </Show>
        </div>
    
    </button>
}
export type Note = NoteType;
export default Note