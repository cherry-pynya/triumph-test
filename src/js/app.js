import ControlPanel from './controlPanel';
import SpherePanel from './spherePanel';
import EventBus from './eventBus';

window.EventBus = new EventBus();
customElements.define('sphere-panel', SpherePanel);
customElements.define('control-panel', ControlPanel);
