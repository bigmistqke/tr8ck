export default () => {
  let i = true;
  return (value: any) => {
    if(i) {
      i = false;
      return false;
    }
    return true;
  }
}