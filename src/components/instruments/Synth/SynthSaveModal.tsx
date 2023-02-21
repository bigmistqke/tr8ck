import { onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import zeptoid from "zeptoid";

export default (props: {
  closeModal: () => void;
  title: string;
  code: string;
}) => {
  let titleRef: HTMLInputElement;
  let closeMenuRef: HTMLDivElement;

  const id = zeptoid();

  const addToStorage = e => {
    e.preventDefault();
    const name = "SYNTH_" + titleRef.value;
    window.localStorage.setItem(name, props.code);
    props.closeModal();
  };

  onMount(() => {
    document.documentElement.style.setProperty("--modal-filter", "blur(15px)");
  });

  onCleanup(() => {
    document.documentElement.style.setProperty("--modal-filter", "");
  });

  return (
    <Portal>
      <div
        ref={closeMenuRef!}
        class="absolute top-0 left-0 z-10 w-full h-full "
        onclick={e => {
          if (e.target === closeMenuRef) props.closeModal();
        }}
      >
        <div class="flex flex-col w-3/6 h-48 absolute z-10 inset-1/2 bg-white -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-xl">
          <div class="flex flex-1 items-center justify-center text-center text-2xl">
            <span>save your patch</span>
          </div>
          <div class="flex flex-1">
            <form onsubmit={addToStorage} class="pl-4 flex-1" id={id}>
              <input
                ref={titleRef!}
                type="text"
                placeholder="enter name effect"
                class="h-full text-2xl w-full ml-4"
                value={props.title.replace("SYNTH_", "")}
              />
            </form>
            <button class="mr-4 ml-4" type="submit" form={id} value="Submit">
              submit
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
