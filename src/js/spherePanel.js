const spherePanel = document.querySelector('#sphere-panel');

// класс региоирует работу элемента со сферой //
export default class SpherePanel extends HTMLElement {
  connectedCallback() {
    const template = document.importNode(spherePanel.content, true);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template);
    this.header = this.shadowRoot.querySelector('.color');
    // регистриуем листенер изменения цвета в элементе ColorPanel //
    window.EventBus.addEventListener('colorHasChanged', (e) => {
      this.header.textContent = e.detail.color;
    });
  }
}
