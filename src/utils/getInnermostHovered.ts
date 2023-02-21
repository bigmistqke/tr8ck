// https://stackoverflow.com/questions/24538450/get-element-currently-under-mouse-without-using-mouse-events

export default function getInnermostHovered() {
  let n = document.querySelector(":hover");
  let nn;
  while (n) {
    nn = n;
    n = nn.querySelector(":hover");
  }
  return nn;
}
