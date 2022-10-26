import { createContext, JSXElement, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { TRACK_AMOUNT, INSTRUMENT_AMOUNT, ROOT_FREQUENCY } from "./constants";
import { defaultPattern } from "./defaults";
import actions from "./actions";
import { AppState } from "./types";

const StoreContext = createContext();
export function useStore() { return useContext(StoreContext)}

export function StoreProvider(props: {children: JSXElement[]}) {
    const [store, setStore] = createStore<AppState>({
        clock: -1,
        faust: undefined,
        context: new window.AudioContext(),
        playMode: "pattern",
        clockOffset: 0,
        bpm: 120,
        rootNode: undefined,
        audioRecorder: undefined,
        patterns: [defaultPattern()],
        composition: [],
        tracks: Array(TRACK_AMOUNT).fill(0).map(()=>({
          instrument: undefined,
          semitones: 0,
          frequency: 0,
          fxChain: [],
          compilingIds: []
        })),
        instruments: Array(INSTRUMENT_AMOUNT)
          .fill(0)
          .map((_,i) =>
            ({
              active: true,
              index: i,
              type: "synth",
              code: "",
              node: undefined,
              color: "",
              pan: 0,
              fxChains: [[]],
              speed: 1,
              compilingIds: [],
              nothings: []
            })
        ),
        editors: [],
        selection: {
          frequency: ROOT_FREQUENCY,
          instrumentIndex: 0,
          patternId: "first",
          blockId: undefined,
          trackIndex: 0
        },
        keys: {
          shift: false,
          control: false,
          alt: false
        },
        faustFactories: [],
        dragging: {
          fx: undefined
        },
        bools: {
          playing: true,
          mousedown: false
        },
        arrayBuffers: [],
        mic: undefined,
        solos: []
      })

  return (
    <StoreContext.Provider value={[store, actions(store, setStore)]}>
      {props.children}
    </StoreContext.Provider>
  );
}
