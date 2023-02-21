export const push = <A, B>(array: A[], element: B) => [...array, element];

export const insert = <A, B>(array: A[], index: number, element: B) => [
  ...array.slice(0, index),
  element,
  ...array.slice(index),
];

export const insertAfterElement = <A, B, C extends A>(
  array: A[],
  element: B,
  other_element: C
) => insert(array, array.indexOf(other_element) + 1, element);

export const insertBeforeElement = <A, B, C extends A>(
  array: A[],
  element: B,
  other_element: C
) => insert(array, array.indexOf(other_element), element);

export const remove = <A>(array: A[], index: number) => [
  ...array.slice(0, index),
  ...array.slice(index + 1),
];

export const removeElement = <A, B extends A>(array: A[], element: B) =>
  remove(array, array.indexOf(element));

export const shuffle = <A>(array: A[]) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

export default {
  push,
  insert,
  insertAfterElement,
  insertBeforeElement,
  remove,
  removeElement,
  shuffle,
};
