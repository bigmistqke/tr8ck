import { actions, store } from "../../Store";
import { ButtonWithHoverOutline } from "../UIElements";
import zeptoid from "zeptoid";
import { Choice, Pattern } from "../../types";

export default (props: { pattern: Pattern; index: number }) => {
  const dragEnd = () => actions.setDragging("composition", undefined);

  const dragStart = () => {
    const block = {
      type: "element",
      patternId: props.pattern.id,
      id: zeptoid(),
    };

    actions.setDragging("composition", block);
  };

  const contextMenu = e => {
    const options: Choice[] = [
      {
        title: "duplicate",
        callback: () => actions.duplicatePattern(props.pattern),
      },
    ];

    if (store.selection.patternId !== props.pattern.id) {
      options.push({
        title: "select",
        callback: () => actions.setSelectedPatternId(props.pattern.id),
      });
    }

    actions.openContextMenu({ e, options });
  };

  return (
    <div
      draggable={true}
      ondragend={dragEnd}
      ondragstart={dragStart}
      ondblclick={() => actions.setSelectedPatternId(props.pattern.id)}
      oncontextmenu={contextMenu}
      class="flex mb-2 rounded-xl translate-x-0"
    >
      <ButtonWithHoverOutline
        class="cursor-pointer w-full flex-1"
        style={{
          background: actions.getPatternColor(props.pattern.id) || "",
        }}
      >
        #{props.index}{" "}
      </ButtonWithHoverOutline>
    </div>
  );
};
