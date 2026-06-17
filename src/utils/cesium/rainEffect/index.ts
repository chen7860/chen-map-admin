import type { Viewer } from "cesium";
import WeatherEffect, { type WeatherEffectOptions } from "./rainEffect";

export default class CesiumWeatherEffect {
  private viewer: Viewer;
  private effect: WeatherEffect | null = null;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  start(config: WeatherEffectOptions) {
    this.stop();
    this.effect = new WeatherEffect(this.viewer, config);
  }

  stop() {
    this.effect?.destroy();
    this.effect = null;
  }
}

export type { WeatherEffectOptions, WeatherEffectType } from "./rainEffect";
