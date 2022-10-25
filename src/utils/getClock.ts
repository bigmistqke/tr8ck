import bpmToMs from "./bpmToMs";
export default (timespan: number, bpm: number) => Math.floor((timespan) / bpmToMs(bpm));
