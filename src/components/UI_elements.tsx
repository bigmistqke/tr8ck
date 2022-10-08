import { JSXElement } from "solid-js";

const Button = (props: {onclick?: (e: MouseEvent) => void, children?: JSXElement[] | JSXElement, class?: string, style?: {[key: string]: string}}) => {
    return <button
        onclick={props.onclick}
        class={`flex-1 rounded-xl bg-default-500 text-2xl bg-default-500 bg-white hover:bg-black hover:text-white h-16  uppercase ${props.class || ""}`}
        style={props.style}
    >
        {props.children}
    </button>
}

const Block = (props: {onclick?: (e: Event) => void, children?: JSXElement[] | JSXElement, class?: string, style?: {[key: string]: string}}) => {
    return <div
        class={`flex flex-1 rounded-xl justify-center content-center bg-default-500 text-2xl bg-default-500 bg-white h-16  uppercase ${props.class || ""}`}
        style={props.style}
    >
        <span class="self-center">
            {props.children}
        </span>
    </div>
}

export {Button, Block};