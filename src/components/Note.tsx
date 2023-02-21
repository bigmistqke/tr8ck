import {
  createEffect,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import ftom from "../utils/ftom";
import mton from "../utils/mton";
import { actions, store } from "../Store";
import { ActiveNote, Choice, Note as NoteType } from "../types";

const Note = (props: {
  setNote: (note: Note) => void;
  note: Note;
  shouldBlink: boolean;
  class: string;
}) => {
  const [hovered, setHovered] = createSignal(false);
  const [contextMenuOpen, setContextMenuOpen] = createSignal(false);

  const getColor = () => {
    if (props.note.type === "inactive") return "";
    if (props.note.type === "silence") return "gray";
    return actions.getColorInstrument(props.note.instrumentIndex);
  };

  const shouldDeactivate = () =>
    props.note.type === "silence" ||
    (props.note.type === "active" &&
      store.selection.instrumentIndex === props.note.instrumentIndex &&
      props.note.frequency === store.selection.frequency);

  const addSilence = () => {
    props.setNote({ type: "silence" });
  };

  const addInactive = () => {
    props.setNote({ type: "inactive" });
  };

  const addNote = () => {
    props.setNote({
      type: "active",
      frequency: store.selection.frequency,
      instrumentIndex: store.selection.instrumentIndex,
    });
  };

  const toggleNote = () => {
    if (store.keys.shift) {
      if (props.note.type !== "silence") {
        addSilence();
        return;
      }
      addInactive();
      return;
    }

    if (props.note.type !== "active") {
      addNote();
      return;
    }
    addInactive();
  };

  const mouseout = () => setHovered(false);
  const mouseenter = () => setHovered(true);

  createEffect(() => {
    if (store.keys.control && hovered() && store.bools.mousedown) {
      addNote();
    }
  });

  createEffect(() => {
    if (store.keys.alt && hovered() && store.bools.mousedown) {
      addInactive();
    }
  });

  const contextMenu = async (e: MouseEvent) => {
    setContextMenuOpen(true);

    const options: Choice[] = [];

    const note = props.note;

    if (note.type === "active") {
      options.push({
        title: "select",
        callback: () => {
          actions.setSelectedInstrumentIndex(note.instrumentIndex);
          actions.setSelectedFrequency(note.frequency);
        },
      });
    }

    const types: [type: string, title: string, callback: () => void][] = [
      ["active", "add note", addNote],
      ["silence", "add silence", addSilence],
      ["inactive", "clear note", addInactive],
    ];

    for (let [type, title, callback] of types) {
      if (type === note.type) continue;
      options.push({
        title,
        callback,
      });
    }

    await actions.openContextMenu({ e, options });
    setContextMenuOpen(false);
  };

  return (
    <button
      onclick={toggleNote}
      oncontextmenu={contextMenu}
      onmousemove={mouseenter}
      onmouseout={mouseout}
      class={`flex-1 flex overflow-auto flex-row ${props.class} items-center`}
    >
      <div
        class={`flex flex-1 h-full relative overflow-hidden rounded-xl hover:bg-selected-instrument ${
          props.shouldBlink ? "bg-white" : "bg-neutral-900"
        } ${contextMenuOpen() ? "bg-selected-instrument" : ""}`}
        style={{
          background: getColor(),
          "min-height": "1rem",
          filter: props.shouldBlink ? "brightness(1.5)" : "",
        }}
      >
        <Switch>
          <Match when={props.note.type === "active"}>
            <div class="h-full flex-1 self-center flex items-center justify-center text-xs">
              {mton(ftom((props.note as ActiveNote).frequency))}
            </div>
          </Match>
          {/* <Match when={props.note.type === "silence"}>
            <div class="flex-1 bg-neutral-500"/>
          </Match> */}
        </Switch>
      </div>
    </button>
  );
};
export type Note = NoteType;
export default Note;
