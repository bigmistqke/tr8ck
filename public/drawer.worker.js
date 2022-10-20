
const WaveDrawer = function(){
  this.canvas, this.context, this.waveform;

  let highest = 0;
  let ratio, 
    filter;

  this.navigation = {
    start: 0,
    end: 0
  }

  this.selection = {
    start: 0,
    end: 0
  }

  this.setCanvas = (canvas) => {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }

  this.setWaveform = (waveform) => this.waveform = waveform;

  const scaleY = (amplitude, height) => {
    const range = 256;
    const offset = 128;
    return height - ((amplitude + offset) * height) / range;
  }

  const drawSample = (x, y, negative = false) => {
    if(
      (!negative && y > highest)
      || (negative && y < highest)
    )
      highest = y;
    if(x % filter === filter - 1){
      const _x = (x ) * ratio;
      const _y = scaleY(highest, this.canvas.height) + 0.5;
      this.context.lineTo(_x, _y);
      highest = 0;
    }
  }

  this.drawWaveformToCanvas = (width) => {
    // console.time("draw_wave");
    
    if(!this.waveform || !this.context) return;

    const {start, end} = this.navigation;

    this.canvas.width = width;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ratio = width / (this.waveform.length - start - end);
    filter = Math.max(1, Math.floor(1 / ratio));

    this.context.beginPath();

    highest = 0;
    
    for (let x = start; x < (this.waveform.length - end); x++) {
      drawSample(x - start, this.waveform.max[x])
    }

    highest = 0;

    for (let x = (this.waveform.length - 1 - end); x >= start; x--) {
      drawSample(x - start, this.waveform.min[x], true)
    }
    
    this.context.closePath();

    this.context.strokeStyle = "rgb(82 82 82 / var(--tw-bg-opacity))";
    this.context.lineWidth = 1;
    this.context.stroke();
    this.context.fillStyle = "rgb(82 82 82 / var(--tw-bg-opacity))";
    this.context.fill();
    
    // console.timeEnd("draw_wave");
  }

  this.clear = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

const drawer = new WaveDrawer();

self.onmessage = function(ev) {
  if(ev.data.msg === 'offscreen') {
    drawer.canvas = ev.data.canvas;
    drawer.context = ev.data.canvas.getContext('2d');
  }
  if(ev.data.msg === 'waveform') {
    drawer.waveform = ev.data.waveform;
  }
  if(ev.data.msg === "navigation"){
    drawer.navigation.start = ev.data.start;
    drawer.navigation.end = ev.data.end; 
  }
  if(ev.data.msg === "selection"){
    drawer.selection.start = ev.data.start;
    drawer.selection.end = ev.data.end; 
  }
  if(ev.data.msg === "render") {
    width = ev.data.width;
    drawer.drawWaveformToCanvas(width);
  }
  if(ev.data.msg === "clear") {
    drawer.clear();
  }
/*   if(ev.data.msg === "pan") {
    pan = ev.data.pan;
    drawer.drawToCanvas(start, end, width);
  }
  if(ev.data.msg === "zoom") {
    start = ev.data.start;
    end = ev.data.end;
    width = ev.data.width;
    drawer.drawToCanvas(start, end, width);
  } */
}