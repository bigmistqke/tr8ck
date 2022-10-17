import fals from "fals";
import { FaustAudioWorkletNode } from "faust2webaudio";
import { TFaustUIItem, TFaustUIGroup } from "faust2webaudio/src/types";
import { FxParameter } from "../types";

export default (node: FaustAudioWorkletNode) => {
  if(!node) return []
  let parameters : FxParameter[] = [];
  const walk = (node: TFaustUIItem) => {
    if("items" in node){
      node.items.forEach(item => walk(item))
    }else{
      console.log(node);
      if(!("step" in node) || fals(node.step) || !("init" in node) || fals(node.init)) {
        console.error('this parameter is an output parameter?', node);
        return;
      }
      parameters.push({
        address: node.address,
        label: node.label,
        max: node.max || 1,
        min: node.min || 0,
        step: node.step || 0.1,
        value: node.init || 0.5,
        init: node.init || 0.5
      });
    }
  }
  node.dspMeta.ui.forEach((node: TFaustUIGroup)=> walk(node))
  return parameters;
}
