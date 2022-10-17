import { Faust } from "faust2webaudio"

export default async () => {
  const faust = new Faust({
    wasmLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.wasm",
    dataLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.data",
  })
  await faust.ready
  return faust
}