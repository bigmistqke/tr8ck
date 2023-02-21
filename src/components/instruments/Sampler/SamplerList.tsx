import { store, actions } from "../../../Store";
import List from "../../List";
import { Button } from "../../UIElements";

export default (props: {
  setFilesOpened: (bool: boolean) => void;
  input: HTMLInputElement;
}) => {
  const choices = () =>
    store.arrayBuffers.map(({ arrayBuffer, name }) => ({
      title: name,
      callback: () => {
        actions.setSamplerFromArrayBuffer({ arrayBuffer, name });
        props.setFilesOpened(false);
      },
    }));

  return (
    <div class="flex flex-col flex-1 gap-2 ">
      <List choices={choices()} />
      <div class="flex-0 ">
        <Button extraClass="h-6 w-full" onclick={() => props.input.click()}>
          upload from computer
        </Button>
      </div>
    </div>
  );
};
