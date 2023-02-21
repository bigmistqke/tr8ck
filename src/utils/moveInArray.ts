const moveInArray = function (arr: any[], from: number, to: number) {
  // Make sure a valid array is provided
  if (Object.prototype.toString.call(arr) !== "[object Array]") {
    throw new Error("Please provide a valid array");
  }

  // Delete the item from it's current position
  var item = arr.splice(from, 1);

  // Make sure there's an item to move
  if (!item.length) {
    throw new Error("There is no item in the array at index " + from);
  }

  // Move the item to its new position
  arr.splice(to, 0, item[0]);
};

export default moveInArray;
