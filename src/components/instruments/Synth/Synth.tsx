import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  Show,
  Switch,
  untrack,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import zeptoid from "zeptoid";
import CodeMirror from "../../../libs/codemirror6/CodeMirror";
import { actions, store } from "../../../Store";
import { FaustElement, Synth as SynthType } from "../../../types";
import Fx from "../../Fx/Fx";
import { Block, Button } from "../../UIElements";
import SynthList from "./SynthList";
import SynthSaveModal from "./SynthSaveModal";

const Synth = (props: { instrument: SynthType }) => {
  let container: HTMLDivElement;

  const [listOpened, setListOpened] = createSignal(false);
  const [error, setError] = createSignal<string | undefined>(undefined);
  const [saveModal, setSaveModal] = createSignal<{
    code: string;
    title: string;
  }>();
  const [saveError, setSaveError] = createSignal(false);

  const compileCode = async (code: string) => {
    code = code.replaceAll(/\n\n/g, "\n");
    actions.setInstrument(
      store.selection.instrumentIndex,
      produce(instrument => ((instrument as SynthType).code = code))
    );
    return await actions.compileFaust(code);
  };

  const processCode = async (code?: string) => {
    code =
      code || (container.querySelector(".cm-content") as HTMLElement).innerText;
    const result = await compileCode(code);

    if (!result.success) {
      setError(result.error);
      return result;
    } else {
      setError(undefined);
    }

    const factory = actions.createFactory(result.dsp, zeptoid());

    const elements = (await Promise.all(
      store.tracks.map(track =>
        actions.createFaustElementFromFaustFactory({
          factory,
          id: zeptoid(),
          active: true,
          parameters: actions.getParametersFromDsp(result.dsp),
        })
      )
    )) as FaustElement[];

    props.instrument.elements?.forEach(element => {
      // TODO: Property 'disconnect' does not exist on type 'FaustAudioWorkletNode'.
      element?.node.disconnect();
    });

    actions.setSelectedInstrument("elements", elements);
    return result;
  };

  const handleSaveCode = async (code?: string) => {
    const result = await saveCode(code);
    if (!result) return;
    setSaveError(true);
    setTimeout(() => {
      setSaveError(false);
    }, 3000);
  };

  const saveCode = async (code?: string) => {
    code =
      code || (container.querySelector(".cm-content") as HTMLElement).innerText;

    if (!code.match(/declare  *name/)) {
      // TODO:  currently we do not allow code without name-declaration to be saved
      //        in the future we should
      //          - pop up a modal to warn the user no 'declare name "synth_name"' is found in the code
      console.error("can not save synth without declared name");
      return false;
    }

    const result = await compileCode(code);

    if (!result.success) {
      // TODO:  currently we do not allow invalid code to be saved
      //        in the future we should allow invalid code to be saved
      //          - pop up the modal to get the title
      //          - mark the bubble in the synth-list with an icon/red outline to indicate it's invalid
      console.error("can not compile code");
      return false;
    }

    const title = result.dsp.dspMeta.name;

    if (actions.doesSynthExistInLocalStorage(title)) {
      // TODO:  currently we do not allow synths to be overwritten
      //        in the future we should allow for synths to be overwritten
      //          - pop up the modal to confirm overwriting (explaining )
      //          - mark the bubble in the synth-list with an icon/red outline to indicate it's invalid
      console.error("overwriting existing synth");
    }

    window.localStorage.setItem("SYNTH_" + title, code);

    return true;
  };

  const openEditor = () => {
    actions.addToEditors({
      id: zeptoid(),
      code: () => props.instrument.code,
      compile: async code => {
        const result = await processCode(code);
        return result!;
      },
    });
  };

  const parameterValues = createMemo(() =>
    props.instrument.elements[0]?.parameters.map(({ value }) => value)
  );

  // TODO: setting signals inside an effect could have performance implications
  createEffect(() => {
    const elements = props.instrument.elements;
    if (elements.length === 0) return;

    const values = parameterValues();

    untrack(() => {
      elements[0].parameters.forEach((parameter, parameterIndex) => {
        elements.forEach((element, index) => {
          if (index === 0) return;
          const newValue = values[parameterIndex];
          const parameter = element.parameters[parameterIndex];
          if (parameter.value === newValue) return;
          const [_, setParameter] = createStore(parameter);
          setParameter("value", newValue);
          element.node.setParamValue(parameter.address, newValue);
        });
      });
    });
  });

  return (
    <>
      <Show when={saveModal()} keyed>
        {({ title, code }) => (
          <SynthSaveModal
            title={title}
            closeModal={() => setSaveModal()}
            code={code}
          />
        )}
      </Show>
      <div class="flex flex-1 flex-col gap-2">
        <div class="flex flex-col h-48" ref={container!}>
          <Switch>
            <Match when={listOpened()}>
              <SynthList
                setCode={code => {
                  setListOpened(false);
                  if (code) {
                    // setCode(code);
                    processCode(code);
                  } else {
                    console.error("code or title is undefined", code);
                  }
                }}
              />
            </Match>
            <Match when={!listOpened()}>
              <CodeMirror
                code={() => props.instrument.code}
                class={"h-full"}
                error={error()}
                containerClass="flex flex-col h-full"
              />
            </Match>
          </Switch>
        </div>

        <div class="flex gap-2 h-6">
          <Button onclick={e => processCode()}>compile</Button>
          <Button onclick={e => handleSaveCode()} error={saveError()}>
            save
          </Button>
          <Button onclick={() => setListOpened(bool => !bool)}>
            {!listOpened() ? "open" : "close"} list
          </Button>
          <Button onclick={openEditor}>window</Button>
        </div>

        <Show when={props.instrument.elements[0]}>
          <Block
            extraClass={`relative flex gap-2 h-24 p-2 bg-white whitespace-nowrap overflow-x-auto`}
          >
            <Fx state={props.instrument.elements[0]} disableOnOff={true} />
          </Block>
        </Show>
      </div>
    </>
  );
};

export default Synth;
