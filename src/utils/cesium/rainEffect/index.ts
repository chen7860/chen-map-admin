import './rainEffect';
import * as Cesium from 'cesium';

export default class useRainEffect {
  effect;
  constructor() {}

  start(config) {
    this.stop();
    this.effect = new Cesium.Material.RainEffect(window.viewer, config);
  }

  stop() {
    if (this.effect) {
      this.effect.destroy();
    }
  }
}
