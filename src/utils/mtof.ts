export default (midi: number) => Math.pow(2, (midi - 69) / 12) * 440;
