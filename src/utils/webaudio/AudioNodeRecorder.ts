export default class {
  recorder?: MediaRecorder;
  constructor(audioNode: AudioNode, context: AudioContext) {
    let recordingStream = context.createMediaStreamDestination();
    audioNode.connect(recordingStream);

    this.recorder = new MediaRecorder(recordingStream.stream);
    this.recorder.start();
  }

  async stop() {
    return new Promise((resolve: (data: Blob) => void) => {
      this.recorder!.addEventListener("dataavailable", e => resolve(e.data));
      this.recorder!.stop();
    });
  }
}
