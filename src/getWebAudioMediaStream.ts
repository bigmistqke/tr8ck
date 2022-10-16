export async function getWebAudioMediaStream() {
  if (!window.navigator.mediaDevices) {
    throw new Error(
      "This browser does not support web audio or it is not enabled."
    )
  }

  try {
    const result = await window.navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })

    return result
  } catch (e: any) {
    switch (e.name) {
      case "NotAllowedError":
        throw new Error(
          "A recording device was found but has been disallowed for this application. Enable the device in the browser settings."
        )

      case "NotFoundError":
        throw new Error(
          "No recording device was found. Please attach a microphone and click Retry."
        )

      default:
        throw e
    }
  }
}
