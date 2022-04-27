/* eslint-disable class-methods-use-this */
import hexToRgba from 'hex-to-rgba';

const spherePanel = document.querySelector('#sphere-panel');

// класс региоирует работу элемента со сферой //
export default class SpherePanel extends HTMLElement {
  connectedCallback() {
    const template = document.importNode(spherePanel.content, true);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template);
    this.header = this.shadowRoot.querySelector('.color');
    this.canvas = this.shadowRoot.querySelector('.sphere-canvas');
    this.initGL();
    // регистриуем листенер изменения цвета в элементе ColorPanel //
    window.EventBus.addEventListener('colorHasChanged', (e) => {
      const { color } = e.detail;
      if (color === '') return false;
      this.draw(this.getRgba(color));
      return true;
    });
  }

  getRgba(color) {
    const rgba = hexToRgba(color).slice(5);
    const numbers = rgba.slice(0, rgba.length - 1);
    const arr = numbers.split(', ');
    return arr.map((el) => Number(el));
  }

  // метод принимает текст ошибки //
  // и выводит его для пользователя //
  showErrorMessage(text) {
    this.canvas.remove();
    const message = document.createElement('span');
    message.textContent = text;
    this.insertAdjacentElement('beforeend', message);
  }

  initGL() {
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
      this.showErrorMessage('Ваш браузер не поддерживает WebGl!');
    }
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type); // создание шейдера
    this.gl.shaderSource(shader, source); // устанавливаем шейдеру его программный код
    this.gl.compileShader(shader); // компилируем шейдер
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (success) { // если компиляция прошла успешно - возвращаем шейдер
      return shader;
    }
    this.showErrorMessage('Не удалось создать шейдер!');
    return false;
  }

  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) {
      return program;
    }
    this.showErrorMessage('Не удалось создать программу!');
    return false;
  }

  draw(color) {
    const vertexShaderSource = document.querySelector('#vertex-shader-2d').text;
    const fragmentShaderSource = document.querySelector('#fragment-shader-2d').text;
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );
    this.program = this.createProgram(vertexShader, fragmentShader);
    const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    // Указываем атрибуту, как получать данные от positionBuffer (ARRAY_BUFFER)
    const size = 2; // 2 компоненты на итерацию
    const type = this.gl.FLOAT; // наши данные - 32-битные числа с плавающей точкой
    const normalize = false; // не нормализовать данные
    // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
    const stride = 0;
    const offset = 0; // начинать с начала буфера
    this.gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset,
    );
    const colorUniformLocation = this.gl.getUniformLocation(this.program, 'u_color');
    this.gl.uniform4f(
      colorUniformLocation,
      color[0] / 255,
      color[1] / 255,
      color[2] / 255,
      color[3],
    );
    const primitiveType = this.gl.TRIANGLES;
    const count = 3;
    this.gl.drawArrays(primitiveType, offset, count);
  }
}
