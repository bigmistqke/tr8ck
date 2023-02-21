import WaveformData from "waveform-data";
import { Waveform } from "../../types";
import normalizeArray from "../../utils/normalizeArray";

const arrayBufferToWaveform = (
  arrayBuffer: ArrayBuffer,
  context: AudioContext
) =>
  new Promise((resolve: (data: Waveform) => void, reject) => {
    WaveformData.createFromAudio(
      {
        audio_context: context,
        array_buffer: arrayBuffer,
        scale: 128,
      },
      (err, waveform) => {
        if (err) {
          reject(err);
        } else {
          const channel = waveform.channel(0);
          resolve({
            max: normalizeArray(channel.max_array()),
            min: normalizeArray(channel.min_array(), true),
            length: waveform.length,
          });
        }
      }
    );
  });

export default arrayBufferToWaveform;
