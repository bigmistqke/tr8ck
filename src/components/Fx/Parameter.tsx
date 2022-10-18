import { FaustAudioWorkletNode } from "faust2webaudio";
import { createStore } from "solid-js/store";
import { store } from "../../Store";
import { FxParameter } from "../../types";
import { Knob } from "../UI_elements";

export default (props: {parameter: FxParameter, node?: FaustAudioWorkletNode}) => {
  const [_, setParameter] = createStore<FxParameter>(props.parameter);

  const update = (delta: number) => {
    if(!props.node) return;

    const range = props.parameter.max - props.parameter.min;
    const track = store.tracks[store.selection.trackIndex];
    
    const value = props.parameter.value + delta * range / 500
    if(value < props.parameter.min || value > props.parameter.max) return;
    setParameter("value", value);
    if(
      !(props.node === track.pitchshifter 
      && props.parameter.label === "shift")        
    ){
      props.node.setParamValue(props.parameter.address, value)
    }else{
      console.log(value, track.semitones,  value + track.semitones)
      props.node.setParamValue(props.parameter.address, value + track.semitones)
    }
  }
  const getRotation = () => (props.parameter.value - props.parameter.min) / (props.parameter.max - props.parameter.min) * 180 - 90;
  return <Knob rotation={getRotation()} onchange={update} label={props.parameter.label} />
}