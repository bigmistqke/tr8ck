export default class{
  recorder?: MediaRecorder
  constructor(stream: MediaStream){
    this.recorder = new MediaRecorder(stream);
    this.recorder.start();
  }

  async stop(){
    return new Promise((resolve: (data:Blob) => void) => {
      this.recorder!.addEventListener('dataavailable', (e) => resolve(e.data));
      this.recorder!.stop();
    })
  }
}