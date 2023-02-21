import fals from "fals";
import { FaustAudioWorkletNode } from "faust2webaudio";
import {
  TFaustUIItem,
  TFaustUIGroup,
  TCompiledDsp,
} from "faust2webaudio/src/types";
import { FaustParameter } from "../../types";

export default (node: FaustAudioWorkletNode | TCompiledDsp) => {
  if (!node) return [];
  let parameters: FaustParameter[] = [];
  const walk = (node: TFaustUIItem) => {
    if ("items" in node) {
      node.items.forEach(item => walk(item));
    } else {
      if (node.type === "button") {
        parameters.push({
          address: node.address,
          label: node.label,
        });
        return;
      }

      if (
        !("step" in node) ||
        fals(node.step) ||
        !("init" in node) ||
        fals(node.init)
      ) {
        console.error("this parameter is an output parameter?", node);
        return;
      }

      const init = node.init !== undefined ? node.init : 0.5;

      parameters.push({
        address: node.address,
        label: node.label,
        max: node.max || 1,
        min: node.min || 0,
        step: node.step || 0.1,
        value: init,
        init: init,
      });
    }
  };
  node.dspMeta.ui.forEach((node: TFaustUIGroup) => walk(node));
  return parameters;
};
