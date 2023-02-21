import { createEffect } from "solid-js";
import { actions, store } from "../../Store";
import { CompositionElementProps } from "../../types";
import { CompositionBar } from "../UIElements";

export default (props: { element: CompositionElementProps }) => {
  return (
    <CompositionBar
      id={props.element.id}
      selected={
        store.selection.composition &&
        store.selection.composition.indexOf(props.element) !== -1
      }
      active={props.element.id === store.playingElementPattern?.element.id}
      color={actions.getPatternColor(props.element.patternId)}
    >
      <div class="pointer-events-none flex flex-col gap-2">
        #{actions.getPatternIndex(props.element.patternId)}
      </div>
    </CompositionBar>
  );
};
