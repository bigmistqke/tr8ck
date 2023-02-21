function cursorEventHandler(move_callback: (e: MouseEvent) => void = () => {}) {
  return new Promise(resolve => {
    const end = (e: MouseEvent | PointerEvent | DragEvent) => {
      window.removeEventListener("pointermove", move_callback);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("dragend", end);
      resolve(e);
    };
    window.addEventListener("pointermove", move_callback);
    window.addEventListener("pointerup", end);
    window.addEventListener("mouseup", end);
    window.addEventListener("dragend", end);
  });
}
export default cursorEventHandler;
