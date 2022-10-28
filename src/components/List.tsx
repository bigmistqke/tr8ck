import { For } from "solid-js";

/* function allStorage() {
  const entries = []
  const  keys = Object.keys(localStorage)
  let i = keys.length;

  while ( i-- ) {
    if(keys[i].startsWith("SYNTH_")){
      entries.push([keys[i], localStorage.getItem(keys[i])] );
    }
  }

  return entries;
} */

export default (props: {choices: {title: string, callback: () => void}[]}) => {
  return <div
      class={`flex flex-1 gap-2 h-48 text-xs uppercase overflow-y-auto flex-wrap overflow-x-hidden content-baseline tracking-widest bg-white rounded-xl p-2`}
      style={{
        "align-content": "baseline"
      }}
  >
      <For each={props.choices}>
          {
              ({title,callback}) => <button
                  class="h-6 flex flex-0 pl-4 pr-4 uppercase justify-center items-center rounded-xl spacing-widest cursor-pointer bg-neutral-300 hover:bg-black hover:text-white"
                  onclick={callback}
              >{title}</button>
          }
      </For>
  </div>
}