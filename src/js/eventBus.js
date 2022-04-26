// глобальный объект эвентов //
// заменяет сторадж //
export default class EventBus {
  // создаем псевдоэлемент //
  constructor() {
    this.bus = document.createElement('fakeelement');
  }

  // метод регистрирует евент листенер //
  addEventListener(event, callback) {
    this.bus.addEventListener(event, callback);
  }

  // метод удаляет эвент листенер //
  removeEventListener(event, callback) {
    this.bus.removeEventListener(event, callback);
  }

  // метод диспатчит эвент //
  dispatchEvent(event, detail = {}) {
    this.bus.dispatchEvent(new CustomEvent(event, { detail }));
  }
}
