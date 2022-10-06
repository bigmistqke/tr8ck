import { JSXElement } from "solid-js";

const Button = (props: {onclick?: (e: Event) => void, children?: JSXElement[] | JSXElement }) => {
    return <button
        onclick={props.onclick}
        class="flex-1 rounded-xl bg-default-500 text-2xl bg-default-500 bg-white hover:bg-black hover:text-white h-16"
    >
        {props.children}
    </button>
}

const Block = (props: {onclick?: (e: Event) => void, children?: JSXElement[] | JSXElement}) => {
    return <div
        class="flex flex-1 rounded-xl justify-center content-center bg-default-500 text-2xl bg-default-500 bg-white h-16"
    >
        <span class="self-center">
            {props.children}
        </span>
    </div>
}

export {Button, Block};