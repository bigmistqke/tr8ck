import { Sampler } from "../types"

const SoundVisualizer = () => {
    return (
      <div class="relative flex flex-1 border-2 border-black bg-default-500">
        <div class="absolute w-full inset-y-1/2 h-2 -mt-1 bg-white" />
        <canvas ></canvas>
      </div>
    )
  }
  
const SamplerUI = (props: {
    instrument: Sampler
}) => {
    return (
        <>
        <SoundVisualizer />
        <div class="flex">
            <div>
            <label>begin sample</label>
            <input type="number" class="flex-1" />
            </div>
            <div>
            <label>end sample</label>
            <input type="number" class="flex-1" />
            </div>
        </div>
        </>
    )
}
  
export default SamplerUI