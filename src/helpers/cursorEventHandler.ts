function cursorEventHandler(move_callback: (e: MouseEvent) => void = () => { }) {
    return new Promise((resolve) => {
        const end = (e: MouseEvent | PointerEvent) => {
            window.removeEventListener("pointermove", move_callback);
            window.removeEventListener("pointerup", end);
            resolve(e);
        }
        window.addEventListener("pointermove", move_callback);
        window.addEventListener("pointerup", end);
    })
}
export default cursorEventHandler;