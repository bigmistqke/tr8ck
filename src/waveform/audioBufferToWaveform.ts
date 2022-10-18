import WaveformData from "waveform-data";
import { Waveform } from "../types";
import normalizeArray from "../helpers/normalizeArray";

const audioBufferToWaveform = (audioBuffer: AudioBuffer, context: AudioContext) => 
  new Promise((resolve: (data: Waveform) => void, reject) => {
    WaveformData.createFromAudio({
      audio_context: context,
      audio_buffer: audioBuffer,
      scale: 128
    }, (err, waveform) => {
      if (err) {
        reject(err);
      }
      else {
        const channel = waveform.channel(0);
        resolve({max: normalizeArray(channel.max_array()), min: normalizeArray(channel.min_array(), true), length: waveform.length});
      }
    });
  })

export default audioBufferToWaveform