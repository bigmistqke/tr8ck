// import Drawer from "./Drawer"

importScripts("./Drawer")

const drawer = new Drawer();

self.onmessage = function(ev) {
  if(ev.data.msg === 'offscreen') {
    drawer.canvas = ev.data.canvas;
    drawer.context = ev.data.canvas.getContext('2d');
  }
  if(ev.data.msg === 'waveform') {
    drawer.waveform = ev.data.waveform;
  }
  if(ev.data.msg === "render") {
    start = ev.data.start;
    end = ev.data.end;
    width = ev.data.width;
    drawer.drawToCanvas(start, end, width);
  }
}