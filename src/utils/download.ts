export default (content: any, name: string = "") => {
  const encodedUri = window.URL.createObjectURL(content);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", name);
  link.click();
}