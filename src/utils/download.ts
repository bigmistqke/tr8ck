export default (content: string, filename: string) => {
  var element = document.createElement("a");

  const blob = new Blob([content], {
    type: "text/plain",
  });

  element.setAttribute("href", URL.createObjectURL(blob));
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};
