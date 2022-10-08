const getLocalPosition = (e: MouseEvent) => {
    const target = e.target as HTMLButtonElement;
    const rect = target.getBoundingClientRect();
  
    const pixels = {
      x : e.clientX - rect.left,
      y : e.clientY - rect.top,
    }
    const percentage = {
      x : pixels.x / rect.width * 100,
      y : pixels.y / rect.height * 100,
    }
    return {pixels, percentage}
}
export default getLocalPosition