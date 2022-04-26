import Picker from 'vanilla-picker';
import { nanoid } from 'nanoid';
import tableItem from './tableItem';
import getDragAfterElement from './getDragAfterElement';

const controlPanel = document.querySelector('#controlPanel');

// класс отвечает за работу контрольной панели таблицы цветов //
export default class ControlPanel extends HTMLElement {
  constructor() {
    super();
    this.colors = [];
    this.storage = {};
    this.dragItem = null;
  }

  connectedCallback() {
    const template = document.importNode(controlPanel.content, true);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template);
    // выбираем нужный детей элемента //
    this.table = this.shadowRoot.querySelector('.table-body');
    this.saveButton = this.shadowRoot.querySelector('.save');
    this.addButton = this.shadowRoot.querySelector('.add-button');
    this.modal = this.shadowRoot.querySelector('.modal');
    this.form = this.shadowRoot.querySelector('.modal-container ');
    // и навешиваем листенеры //
    this.saveButton.addEventListener('click', () => {
      this.saveToStorage();
    });
    this.addButton.addEventListener('click', () => {
      this.toggleModal();
    });
    this.modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.toggleModal();
      }
    });
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitForm();
    });
    this.table.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(this.table, e.clientY);
      if (afterElement == null) {
        this.table.appendChild(this.dragItem);
      } else {
        this.table.insertBefore(this.dragItem, afterElement);
      }
    });
    this.table.addEventListener('click', (e) => {
      if (e.target.closest('button')) {
        // отслеживаем клик по иконкам удаления //
        if (e.target.closest('button').classList.contains('delete')) {
          this.deleteItem(e.target.closest('button').id);
        }
        // отслеживаем клик по иконкам редактирования //
        if (e.target.closest('button').classList.contains('edit')) {
          this.setColorToForm(e.target.closest('button').id);
          this.toggleModal();
        }
      }
    });
    this.saveToStorage.bind(this);
    this.toggleModal.bind(this);
    this.submitForm.bind(this);
    // проверяем локальное хранилище и рендерим строки таблицы отрисовываем пикер//
    this.getFromStorage();
    this.renderTableRows();
    this.mountPicker();
    this.settingPrimeColor();
    // диспатчим активный цвет в сферу //
    window.EventBus.dispatchEvent('colorHasChanged', { color: this.getAttribute('color') });
  }

  // меняем видимость модального окна и чистим форму//
  toggleModal() {
    if (this.modal.classList.contains('active')) {
      this.storage = {};
      this.form.querySelector('#name').value = '';
      this.form.querySelector('#type').selectedIndex = 0;
      this.form.querySelector('.form-add-button-text').textContent = 'Добавить';
    }
    this.modal.classList.toggle('active');
    this.modal.querySelector('.modal-container').classList.toggle('active');
  }

  // переносим данные из строки в форму //
  setColorToForm(id) {
    const item = this.colors.find((el) => el.id === id);
    const { color, name, type } = item;
    this.storage.id = item.id;
    this.storage.color = color;
    this.picker.setColor(color);
    this.form.querySelector('#name').value = name;
    this.form.querySelector('#type').value = type;
    this.form.querySelector('.form-add-button-text').textContent = 'Сохранить';
  }

  // удалем строку из таблицы //
  deleteItem(id) {
    const index = this.colors.findIndex((el) => el.id === id);
    this.colors.splice(index, 1);
    this.physicalyRemoveItem(id);
    this.reindexColors();
  }

  // удаляем ноду со строкой из таблицы //
  physicalyRemoveItem(id) {
    const child = this.table.querySelector(`#${id}`).closest('tr');
    this.table.removeChild(child);
  }

  // после удаления/смены позиции нужно заново проиндексировать позиции //
  reindexColors() {
    const collectionOfRows = this.table.querySelectorAll('.color-row');
    for (let i = 0; i < collectionOfRows.length; i += 1) {
      const { id } = collectionOfRows[i];
      const item = this.colors.find((el) => el.id === id);
      item.position = i + 1;
    }
    this.colors.sort((a, b) => a.position - b.position);
    this.settingPrimeColor();
  }

  // сабмитим форму в зависимости от добавления или редактирования //
  submitForm() {
    if (typeof this.storage.id === 'undefined') {
      this.addColor();
    } else {
      this.editColor();
    }
    this.toggleModal();
  }

  // обработки формы при добавлении //
  addColor() {
    const name = this.form.querySelector('#name').value;
    const type = this.form.querySelector('#type').value;
    if (name === '') return false;
    const id = nanoid();
    let position;
    if (this.colors.length === 0) {
      position = 1;
    } else {
      position = this.colors.length + 1;
    }
    const { color } = this.storage;
    const item = {
      id,
      position,
      name,
      type,
      color,
    };
    this.colors.push(item);
    const row = tableItem(id, color, name, type);
    this.table.insertAdjacentElement('beforeend', row);
    this.makeDragable(id);
    this.settingPrimeColor();
    return true;
  }

  // редактируем цвет и заново рендерим таблицу//
  editColor() {
    const { id, color } = this.storage;
    const item = this.colors.find((el) => el.id === id);
    const name = this.form.querySelector('#name').value;
    const type = this.form.querySelector('#type').value;
    if (name === '') return false;
    item.name = name;
    item.type = type;
    item.color = color;
    this.physicalyRemoveItem(id);
    const row = tableItem(id, item.color, item.name, item.type);
    const { position } = item;
    if (position === 1) {
      this.table.insertAdjacentElement('afterbegin', row);
    } else {
      const rows = this.shadowRoot.querySelectorAll('.color-row');
      const start = rows[position - 2];
      start.insertAdjacentElement('afterend', row);
    }
    this.makeDragable(id);
    this.settingPrimeColor();
    return true;
  }

  // устанавливаем color picker //
  mountPicker() {
    const parent = this.modal.querySelector('.modal-container-picker-container');
    this.picker = new Picker({
      parent,
      popup: false,
      editor: true,
      editorFormat: 'hex',
      alpha: true,
      color: '#35e9a3ff',
      onChange: (color) => {
        this.storage.color = color.hex;
      },
    });
    this.picker.show();
  }

  // проверяем есть ли сохранненые цвета, если нет то сохраняем пустой массив //
  // если да то достаем их сторадж //
  getFromStorage() {
    const storage = localStorage.getItem('colors');
    if (!storage) {
      localStorage.setItem('colors', JSON.stringify({ colors: [] }));
      this.colors = [];
      return false;
    }
    const { colors } = JSON.parse(storage);
    this.colors = colors;
    this.colors.sort((a, b) => a.position - b.position);
    return true;
  }

  // сохраняем массив данных в локал сторедж //
  saveToStorage() {
    localStorage.setItem('colors', JSON.stringify({ colors: this.colors }));
  }

  // рендерим таблицу //
  renderTableRows() {
    if (this.colors.length === 0) return false;
    this.colors.forEach((el) => {
      const {
        id, color, name, type,
      } = el;
      const row = tableItem(id, color, name, type);
      this.table.insertAdjacentElement('beforeend', row);
      this.makeDragable(id);
    });
    return true;
  }

  // принимаем id строки на которую нужно повесить функционал перетаскивания //
  makeDragable(id) {
    const item = this.table.querySelector(`#${id}`);
    item.addEventListener('dragstart', (e) => {
      e.target.classList.add('hide');
      this.dragItem = item;
    });
    item.addEventListener('dragend', (e) => {
      e.target.classList.remove('hide');
      this.dragItem = null;
      this.reindexColors();
    });
  }

  // метод после изменения внесенного в this.colors проверяет какой цвет на первом месте //
  // если цвет меняется, то меняется атрибут color //
  settingPrimeColor() {
    if (this.colors.length === 0) {
      this.setAttribute('color', '');
      return false;
    }
    if (this.colors[0].color === this.getAttribute('color')) {
      return false;
    }
    this.setAttribute('color', this.colors[0].color);
    return true;
  }

  // гетер для основного цвета //
  get color() {
    return this.getAttribute('color');
  }

  // сеттер для основного цвета //
  set color(value) {
    this.setAttribute('color', value);
  }

  // этот метод нужен для метода ниже по спецификации //
  static get observedAttributes() {
    return ['color'];
  }

  // следим за изменениями атрибута color //
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return false;
    window.EventBus.dispatchEvent('colorHasChanged', { color: this.color });
    return true;
  }
}
