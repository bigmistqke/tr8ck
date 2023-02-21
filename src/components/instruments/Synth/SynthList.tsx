import List from "../../List";

function allStorage() {
  const entries = [];
  const keys = Object.keys(localStorage);
  let i = keys.length;

  while (i--) {
    if (keys[i].startsWith("SYNTH_")) {
      entries.push([keys[i], localStorage.getItem(keys[i])]);
    }
  }

  return entries as string[][];
}

export default (props: {
  setCode: (code: string | null, title: string | null) => void;
}) => {
  const storage = allStorage().map(([title, code]) => ({
    title: title.replace("SYNTH_", ""),
    callback: () => props.setCode(code, title),
  }));

  return <List choices={storage} />;
};
