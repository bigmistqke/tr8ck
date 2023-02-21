import { createEffect, For } from "solid-js";
import { store } from "../../Store";
import { CompositionGroupProps } from "../../types";
import { CompositionBar } from "../UIElements";
import CompositionBlock from "./CompositionBlock";

export default (props: { group: CompositionGroupProps }) => {
  return (
    <CompositionBar
      id={props.group.id}
      selected={store.selection.composition.indexOf(props.group) !== -1}
      color={props.group.color}
    >
      <div class="pointer-events-none flex flex-col gap-2">
        <For each={props.group.blocks}>
          {block => <CompositionBlock block={block} />}
        </For>
      </div>
    </CompositionBar>
  );
};
