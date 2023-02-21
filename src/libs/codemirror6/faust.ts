import { clike } from "@codemirror/legacy-modes/mode/clike";

function words(str: string) {
  const obj: { [key: string]: true } = {},
    words = str.split(" ");
  for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
  return obj;
}

export default clike({
  keywords: words(
    "process component import library declare with environment route waveform soundfile"
  ),
  multiLineStrings: true,
  atoms: words(
    "mem prefix int float rdtable rwtable select2 select3 ffunction fconstant fvariable button checkbox vslider hslider nentry vgroup hgroup tgroup vbargraph hbargraph attach acos asin atan atan2 cos sin tan exp log log10 pow sqrt abs min max fmod remainder floor ceil rint"
  ),
  hooks: {
    "@": function () {
      return "meta";
    },
    "'": function () {
      return "meta";
    },
  },
});
