export default (array: number[], negative: boolean = false) => {
  if (negative) {
    const ratio = (Math.min.apply(Math, array) / 128) * -1;
    return array.map(v => Math.round(v / ratio));
  } else {
    const ratio = Math.max.apply(Math, array) / 128;
    return array.map(v => Math.round(v / ratio));
  }
};
