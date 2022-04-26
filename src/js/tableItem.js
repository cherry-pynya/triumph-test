// делаем html разметку для строки таблицы //
export default function tableItem(id, color, name, type) {
  const item = document.createElement('tr');
  item.classList.add('color-row');
  item.draggable = true;
  item.id = id;
  item.innerHTML = `<th><div class="table-color-sample" style="background-color: ${color}"></div></th><th><span> ${name} </span></th><th><span> ${type} </span></th><th><span> ${color} </span></th><th><button class="unstyled-buton edit" id='${id}'><span class="material-symbols-outlined"> edit </span></button></th><th><button class="unstyled-buton delete" id='${id}'><span class="material-symbols-outlined"> delete </span></button></th>`;
  return item;
}
