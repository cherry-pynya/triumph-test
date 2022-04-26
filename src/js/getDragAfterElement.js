// фуекция принимает контейнер и положение курсора при драге элемента //
// если курсор у начала таблицы то функция вернет контейнер //
// а если нет то элемент перед которым находится курсор //
export default function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll('.color-row:not(.hide)'),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}
