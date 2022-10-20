import { createEffect, Show } from "solid-js"
import ftom from "../helpers/ftom"
import mton from "../helpers/mton"
import { actions, store } from "../Store"
import { Indices, ActiveNote, Note as NoteType} from "../types"

const Note = (props: {
    setNote: ((note: Note) => void)
    note: Note
    shouldBlink: boolean
    class: string
}) => {
    const getColor = () => {
        if(!props.note.active) 
            return ""
        return actions.getColorInstrument(props.note.instrumentIndex)
    }

    const compareIndices = (a: [number,number], b: [number, number]) => a[0] === b[0] && a[1] === b[1]

    const setNote = () => {

        const shouldDeactivate = 
            props.note.active && store.selection.instrumentIndex === props.note.instrumentIndex && 
            props.note.frequency === store.selection.frequency

        props.setNote( 
            shouldDeactivate ? 
            ({active: false}) : 
            ({active: true, frequency: store.selection.frequency, instrumentIndex: store.selection.instrumentIndex})
        );
    }

    return <button
        onclick={setNote}
        class={`flex-1 flex flex-row ${props.class}`}
    >
        <div 
            class={`flex flex-1 h-full relative overflow-hidden rounded-xl hover:bg-selected ${
                props.shouldBlink ? "bg-white" : "bg-black"
            }`}
            style={{background: getColor(), filter: props.shouldBlink ? "brightness(1.5)" : ""}}
        >
            <Show when={props.note.active}>
                <div class="h-full flex-1 self-center flex items-center justify-center" /* style={{background: "rgba(250,250,250,0.125)"}} */>
                    {mton(ftom((props.note as ActiveNote).frequency))}
                </div>
            </Show>
        </div>
    
    </button>
}
export type Note = NoteType;
export default Note