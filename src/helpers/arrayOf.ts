import deepClone from "deep-clone";

export default (amount: number, template: any) => Array(amount).fill(0).map(() => deepClone(template))