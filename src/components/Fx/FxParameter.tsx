import { FaustAudioWorkletNode } from "faust2webaudio";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { actions } from "../../Store";
import { FaustParameter } from "../../types";
import { LabeledKnob } from "../UIElements";

export default (props: {parameter: FaustParameter, node?: FaustAudioWorkletNode}) => {
  const [_, setParameter] = createStore<FaustParameter>(props.parameter);

  const update = (delta: number) => {
    if(!props.node) return;

    const range = props.parameter.max - props.parameter.min;
    const track = actions.getSelectedTrack();
    
    const value = props.parameter.value + delta * range / 500
    if(value < props.parameter.min || value > props.parameter.max) return;
    setParameter("value", value);
    if(
      !(props.node === track.pitchshifter 
      && props.parameter.label === "shift")        
    ){
      props.node.setParamValue(props.parameter.address, value)
    }else{

      props.node.setParamValue(props.parameter.address, value + track.semitones)
    }
  }
  const getRotation = () => (props.parameter.value - props.parameter.min) / (props.parameter.max - props.parameter.min) * 180 - 90;

  return <LabeledKnob 
    rotation={getRotation()} 
    onupdate={update} 
    label={props.parameter.label} 
    class={`${!props.node ? "pointer-events-none" : ""}`}
  />
}