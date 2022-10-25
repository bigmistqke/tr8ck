export default class Emitter{
  eventTarget = document.createDocumentFragment();
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, useCapture: boolean) {
    return this.eventTarget.addEventListener(type, listener, useCapture);
  }

  dispatchEvent(event: Event) {
    return this.eventTarget.dispatchEvent(event);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, useCapture: boolean) {
    return this.eventTarget.removeEventListener(type, listener, useCapture);
  }
}