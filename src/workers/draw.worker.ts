import WaveDrawer from "../utils/WaveDrawer";
import { Waveform } from "../types";

const drawer = new WaveDrawer();

const setCanvas = drawer.setCanvas;
const setWaveform = drawer.setWaveform;
const renderWaveform = drawer.drawToCanvas;

export {
  setCanvas,
  setWaveform,
  renderWaveform
}