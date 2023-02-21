import { createMemo, For } from "solid-js";
import { store } from "../../../Store";
import { Sampler } from "../../../types";

export default (props: { instrument: Sampler; canvasWidth: number }) => {
  const spb = () => 1 / (store.bpm / 60);

  const getRatio = createMemo(() => {
    const { waveform, audioBuffer, speed } = props.instrument;
    if (!audioBuffer || !waveform) return;
    return audioBuffer.duration / (waveform.length * speed);
  });

  const getVisibleTime = createMemo(() => {
    const { waveform, navigation } = props.instrument;
    const ratio = getRatio();
    if (!waveform || !ratio) return;
    const visibleWaveformLength =
      waveform.length - props.instrument.navigation.start - navigation.end;
    return visibleWaveformLength * ratio;
  });

  const gridLines = createMemo(() => {
    const visibleTime = getVisibleTime();
    if (!visibleTime) return [];
    const visibleAmount = visibleTime * spb();
    const flooredAmount = Math.floor(visibleTime * spb()) + 2;
    const gridWidth = props.canvasWidth / visibleAmount;

    return Array(Math.abs(flooredAmount))
      .fill(0)
      .map((_, index) => gridWidth);
  });

  const additionalOffset = createMemo(() => {
    const { selection, navigation } = props.instrument;
    const ratio = getRatio();
    const visibleTime = getVisibleTime();

    if (!ratio || !visibleTime) return 0;

    const visibleAmount = visibleTime * spb();
    const gridWidth = props.canvasWidth / visibleAmount;

    const navigationStartTime = navigation.start * ratio;
    const navigationStartOffset =
      ((navigationStartTime * spb()) % 1) * gridWidth;

    const selectionStartTime = selection.start * ratio;
    const selectionStartOffset = ((selectionStartTime * spb()) % 1) * gridWidth;

    return navigationStartOffset - selectionStartOffset;
  });

  return (
    <div class="absolute w-full h-full top-0 z-10 pointer-events-none">
      <For each={gridLines()}>
        {(gridWidth, index) => (
          <For each={Array(4).fill(0)}>
            {(_, childIndex) => (
              <span
                class="absolute h-full top-0 bg-neutral-200"
                style={{
                  left:
                    gridWidth * (index() - 1) +
                    (gridWidth / 4) * childIndex() -
                    additionalOffset() +
                    "px",
                  background: childIndex() === 0 ? "white" : "",
                  width: childIndex() === 0 ? "4px" : "2px",
                }}
              />
            )}
          </For>
        )}
      </For>
    </div>
  );
};
