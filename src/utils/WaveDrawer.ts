import { Waveform } from "../types";

class WaveDrawer {
  canvas?: HTMLCanvasElement;
  context?: CanvasRenderingContext2D;
  waveform?: Waveform;
  accumulator: number = 0;
  ratio?: number;
  filter?: number;

  constructor() {}

  /*   setCanvas: (canvas: HTMLCanvasElement) => void
  setWaveform: (waveform: Waveform) => void
  drawToCanvas: (start: number, end: number, width: number) => void */

  scaleY = (amplitude: number, height: number) => {
    const range = 256;
    const offset = 128;
    return height - ((amplitude + offset) * height) / range;
  };

  drawSample = (x: number, y: any) => {
    this.accumulator += y;
    if (x % this.filter! === this.filter! - 1) {
      const average = this.accumulator / this.filter!;
      const _x = x * this.ratio!;
      const _y = this.scaleY(average, this.canvas!.offsetHeight) + 0.5;
      this.context!.lineTo(_x, _y);
      this.accumulator = 0;
    }
  };

  setCanvas = (canvas: HTMLCanvasElement) => {
    this.canvas = canvas;
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
  };

  setWaveform = (waveform: Waveform) => (this.waveform = waveform);

  drawToCanvas = (start: number, end: number, width: number) => {
    console.time("draw_wave");
    if (!this.waveform || !this.context || !this.canvas) return;

    this.canvas.width = width;
    this.canvas.height =
      this.canvas.parentElement?.offsetHeight || this.canvas.offsetHeight;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ratio = width / (this.waveform.length - start - end);
    this.filter = Math.max(1, Math.floor(1 / this.ratio));

    this.context.beginPath();

    this.accumulator = 0;

    for (let x = start; x < this.waveform.length - end; x++) {
      this.drawSample(x, this.waveform.max[x] - start);
    }

    this.accumulator = 0;

    for (let x = this.waveform.length - 1 - end; x >= start; x--) {
      this.drawSample(x, this.waveform.min[x] - start);
    }

    this.context.closePath();
    this.context.fillStyle = "white";
    this.context.fill();

    console.timeEnd("draw_wave");
  };
}

/* 
const WaveDrawer = function(this: {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  waveform: Waveform
  setCanvas: (canvas: HTMLCanvasElement) => void
  setWaveform: (waveform: Waveform) => void
  drawToCanvas: (start: number, end: number, width: number) => void;
}){
  this.canvas, this.context, this.waveform;

  let accumulator: number, 
    ratio: number, 
    filter: number;

  const scaleY = (amplitude: number, height: number) => {
    const range = 256;
    const offset = 128;
    return height - ((amplitude + offset) * height) / range;
  }

  const drawSample = (x: number, y: any) => {
    accumulator += y;
    if(x % filter === filter - 1){
      const average = accumulator / filter;
      const _x = (x ) * ratio;
      const _y = scaleY(average, this.canvas.height) + 0.5;
      this.context.lineTo(_x, _y);
      accumulator = 0
    }
  }

  this.setCanvas = (canvas: HTMLCanvasElement) => {
    this.canvas = canvas;
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  this.setWaveform = (waveform: Waveform) => this.waveform = waveform;

  this.drawToCanvas = (start: number, end: number, width: number) => {
    console.time("draw_wave");
    if(!this.waveform || !this.context) return;

    this.canvas.width = width;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ratio = width / (this.waveform.length - start - end);
    filter = Math.max(1, Math.floor(1 / ratio));

    this.context.beginPath();

    accumulator = 0;

    for (let x = start; x < (this.waveform.length - end); x++) {
      drawSample(x, this.waveform.max[x] - start)
    }

    accumulator = 0;

    for (let x = (this.waveform.length - 1 - end); x >= start; x--) {
      drawSample(x, this.waveform.min[x] - start)
    }
    
    this.context.closePath();
    this.context.fillStyle = "white";
    this.context.fill();
    
    console.timeEnd("draw_wave");
  }
} */

export default WaveDrawer;
