const fileToArrayBuffer = (file: File) => 
  new Promise(
    (
      resolve: (result: ArrayBuffer) => void, 
      reject: (error: string) => void
    ) => {
      let reader = new FileReader();
      reader.onload = function(e) {
        resolve(reader.result as ArrayBuffer);
      }
      reader.onerror = function(e) {
        reject("error while reading file");
      }
      reader.readAsArrayBuffer(file);
    }
  )

export default fileToArrayBuffer