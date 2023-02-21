import { actions, store } from "../../Store";
import {
  Choice,
  CompositionElementProps,
  CompositionGroupProps,
} from "../../types";
import CompositionElement from "./CompositionElement";
import CompositionGroup from "./CompositionGroup";

export default (props: {
  block: CompositionElementProps | CompositionGroupProps;
}) => {
  const resetSelection = () => {
    actions.resetCompositionSelection();
    window.removeEventListener("mousedown", resetSelection);
  };

  const dragStart = () => {
    actions.setDragging("composition", props.block);
  };
  const dragEnd = () => {
    actions.setDragging("composition", undefined);
    actions.resetCompositionSelection();
  };

  const contextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (store.selection.composition.length === 0) {
      actions.startCompositionSelection(props.block);
    }

    const block = props.block;

    const options: Choice[] = [
      {
        title: "duplicate",
        callback: actions.duplicateCompositionSelection,
      },
    ];

    if (block.type === "group" && store.selection.composition.length === 1) {
      options.push({
        title: "ungroup",
        callback: () => actions.ungroupCompositionGroup(block),
      });
    }

    if (store.loopingBlock) {
      options.push({
        title: "stop loop",
        callback: actions.resetLoopingBlock,
      });
    }

    if (
      store.selection.composition.length === 1 &&
      store.playMode === "composition"
    ) {
      options.push({
        title: "loop",
        callback: () => actions.setLoopingBlock(props.block),
      });
    }

    if (store.selection.composition.length > 1) {
      options.push({
        title: "group",
        callback: actions.groupCompositionSelection,
      });
    }

    actions.openContextMenu({ e, options });
  };

  const mouseDown = e => {
    if (e.button !== 0) {
      e.stopPropagation();
      return;
    }
    if (!store.contextmenu) e.stopPropagation();

    if (store.selection.composition.length === 0) {
      actions.startCompositionSelection(props.block);
      window.addEventListener("mousedown", () => resetSelection());
    } else {
      if (store.keys.control) {
        actions.endCompositionSelection(props.block);
        return;
      }
      actions.startCompositionSelection(props.block);
    }
  };

  return (
    <div
      draggable={true}
      onmousedown={mouseDown}
      ondragstart={dragStart}
      ondragend={dragEnd}
      class="cursor-move"
      oncontextmenu={contextMenu}
    >
      {/* <div class="pointer-events-none"> */}
      {props.block.type === "element" ? (
        <CompositionElement element={props.block} />
      ) : (
        <CompositionGroup group={props.block} />
      )}
      {/* </div> */}
    </div>
  );
};
