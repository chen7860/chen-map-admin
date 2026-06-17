import * as Cesium from "cesium";
import type { Viewer } from "cesium";

export type WeatherEffectType = "rain" | "snow" | "wind";

export interface WeatherEffectOptions {
  type: WeatherEffectType;
  tiltAngle?: number;
  size?: number;
  speed?: number;
  density?: number;
  opacity?: number;
}

interface SceneWeatherState {
  fogEnabled: boolean;
  fogRenderable: boolean;
  fogDensity: number;
  fogVisualDensityScalar: number;
  fogMaxHeight: number;
  fogMinimumBrightness: number;
  skyHueShift?: number;
  skySaturationShift?: number;
  skyBrightnessShift?: number;
  atmosphereHueShift: number;
  atmosphereSaturationShift: number;
  atmosphereBrightnessShift: number;
}

export default class WeatherEffect {
  private viewer: Viewer;
  private stage: Cesium.PostProcessStage | null = null;
  private options: Required<WeatherEffectOptions>;
  private sceneState: SceneWeatherState | null = null;
  private particleSystem: Cesium.ParticleSystem | null = null;
  private particleDown = new Cesium.Cartesian3();
  private particleModelMatrix = new Cesium.Matrix4();
  private particleWind = new Cesium.Cartesian3();
  private readonly updateRainEmitter = () => {
    this.updateRainEmitterPosition();
  };

  constructor(viewer: Viewer, options: WeatherEffectOptions) {
    if (!viewer) throw new Error("no viewer object!");

    this.viewer = viewer;
    this.options = {
      type: options.type,
      tiltAngle: options.tiltAngle ?? -0.28,
      size: options.size ?? 0.5,
      speed: options.speed ?? 80,
      density: options.density ?? 1,
      opacity: options.opacity ?? 0.5
    };

    this.stage = new Cesium.PostProcessStage({
      name: `czm_${this.options.type}_weather`,
      fragmentShader: this.createShader(),
      uniforms: {
        tiltAngle: () => this.options.tiltAngle,
        size: () => this.options.size,
        speed: () => this.options.speed,
        density: () => this.options.density,
        opacity: () => this.options.opacity
      }
    });

    this.viewer.scene.postProcessStages.add(this.stage);

    if (this.options.type === "rain") {
      this.applyOvercastScene();
      this.createRainParticles();
      this.viewer.scene.preRender.addEventListener(this.updateRainEmitter);
    }
  }

  destroy() {
    if (!this.viewer) return;
    this.viewer.scene.preRender.removeEventListener(this.updateRainEmitter);
    if (this.particleSystem) {
      this.viewer.scene.primitives.remove(this.particleSystem);
      this.particleSystem = null;
    }
    if (this.stage) {
      this.viewer.scene.postProcessStages.remove(this.stage);
      this.stage = null;
    }
    this.restoreScene();
  }

  show(visible: boolean) {
    if (this.stage) {
      this.stage.enabled = visible;
    }
    if (this.particleSystem) {
      this.particleSystem.show = visible;
    }
  }

  private createShader() {
    if (this.options.type === "rain") return this.createOvercastShader();
    if (this.options.type === "snow") return this.createSnowShader();
    return this.createWindShader();
  }

  private applyOvercastScene() {
    const { scene } = this.viewer;
    const { fog, atmosphere, skyAtmosphere } = scene;

    this.sceneState = {
      fogEnabled: fog.enabled,
      fogRenderable: fog.renderable,
      fogDensity: fog.density,
      fogVisualDensityScalar: fog.visualDensityScalar,
      fogMaxHeight: fog.maxHeight,
      fogMinimumBrightness: fog.minimumBrightness,
      skyHueShift: skyAtmosphere?.hueShift,
      skySaturationShift: skyAtmosphere?.saturationShift,
      skyBrightnessShift: skyAtmosphere?.brightnessShift,
      atmosphereHueShift: atmosphere.hueShift,
      atmosphereSaturationShift: atmosphere.saturationShift,
      atmosphereBrightnessShift: atmosphere.brightnessShift
    };

    fog.enabled = this.sceneState.fogEnabled;
    fog.renderable = this.sceneState.fogRenderable;
    fog.density = this.sceneState.fogDensity;
    fog.visualDensityScalar = this.sceneState.fogVisualDensityScalar;
    fog.maxHeight = this.sceneState.fogMaxHeight;
    fog.minimumBrightness = this.sceneState.fogMinimumBrightness;

    atmosphere.saturationShift = -0.26;
    atmosphere.brightnessShift = -0.05;

    if (skyAtmosphere) {
      skyAtmosphere.saturationShift = -0.68;
      skyAtmosphere.brightnessShift = -0.12;
    }
  }

  private restoreScene() {
    if (!this.sceneState || this.viewer.isDestroyed()) return;

    const { scene } = this.viewer;
    const { fog, atmosphere, skyAtmosphere } = scene;

    fog.enabled = this.sceneState.fogEnabled;
    fog.renderable = this.sceneState.fogRenderable;
    fog.density = this.sceneState.fogDensity;
    fog.visualDensityScalar = this.sceneState.fogVisualDensityScalar;
    fog.maxHeight = this.sceneState.fogMaxHeight;
    fog.minimumBrightness = this.sceneState.fogMinimumBrightness;

    atmosphere.hueShift = this.sceneState.atmosphereHueShift;
    atmosphere.saturationShift = this.sceneState.atmosphereSaturationShift;
    atmosphere.brightnessShift = this.sceneState.atmosphereBrightnessShift;

    if (skyAtmosphere) {
      skyAtmosphere.hueShift =
        this.sceneState.skyHueShift ?? skyAtmosphere.hueShift;
      skyAtmosphere.saturationShift =
        this.sceneState.skySaturationShift ?? skyAtmosphere.saturationShift;
      skyAtmosphere.brightnessShift =
        this.sceneState.skyBrightnessShift ?? skyAtmosphere.brightnessShift;
    }

    this.sceneState = null;
  }

  private createRainParticles() {
    const density = this.options.density;
    const rainImage = this.createRainParticleImage();

    this.particleSystem = this.viewer.scene.primitives.add(
      new Cesium.ParticleSystem({
        image: rainImage,
        emitter: new Cesium.BoxEmitter(
          new Cesium.Cartesian3(13000, 9500, 2200)
        ),
        modelMatrix: this.particleModelMatrix,
        emissionRate: 980 * density,
        lifetime: Number.MAX_VALUE,
        minimumParticleLife: 1,
        maximumParticleLife: 1.9,
        minimumSpeed: 1,
        maximumSpeed: 1,
        startColor: Cesium.Color.fromCssColorString("#e8f6ff").withAlpha(0.68),
        endColor: Cesium.Color.fromCssColorString("#dcefff").withAlpha(0.16),
        minimumImageSize: new Cesium.Cartesian2(8, 34),
        maximumImageSize: new Cesium.Cartesian2(16, 72),
        sizeInMeters: false,
        updateCallback: particle => {
          Cesium.Cartesian3.multiplyByScalar(
            this.particleDown,
            1250 + this.options.speed * 5,
            particle.velocity
          );
          Cesium.Cartesian3.add(
            particle.velocity,
            this.particleWind,
            particle.velocity
          );
        }
      })
    );

    this.updateRainEmitterPosition();
  }

  private updateRainEmitterPosition() {
    if (!this.particleSystem || this.viewer.isDestroyed()) return;

    const camera = this.viewer.camera;
    const cameraPosition = camera.positionWC;
    const up = Cesium.Cartesian3.normalize(
      cameraPosition,
      new Cesium.Cartesian3()
    );
    const right = Cesium.Cartesian3.clone(
      camera.rightWC,
      new Cesium.Cartesian3()
    );
    const forward = Cesium.Cartesian3.clone(
      camera.directionWC,
      new Cesium.Cartesian3()
    );
    const emitterPosition = new Cesium.Cartesian3();

    Cesium.Cartesian3.multiplyByScalar(up, 1300, emitterPosition);
    Cesium.Cartesian3.add(cameraPosition, emitterPosition, emitterPosition);
    Cesium.Cartesian3.multiplyByScalar(forward, 2100, forward);
    Cesium.Cartesian3.add(emitterPosition, forward, emitterPosition);

    this.particleModelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      emitterPosition,
      undefined,
      this.particleModelMatrix
    );
    this.particleSystem.modelMatrix = this.particleModelMatrix;

    Cesium.Cartesian3.negate(up, this.particleDown);
    Cesium.Cartesian3.multiplyByScalar(
      right,
      Math.sin(this.options.tiltAngle) * 460,
      this.particleWind
    );
  }

  private createRainParticleImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 76;

    const context = canvas.getContext("2d");
    if (!context) return canvas;

    const gradient = context.createLinearGradient(8, 0, 8, 76);
    gradient.addColorStop(0, "rgba(210, 240, 255, 0)");
    gradient.addColorStop(0.24, "rgba(210, 240, 255, 0.18)");
    gradient.addColorStop(0.58, "rgba(240, 252, 255, 0.86)");
    gradient.addColorStop(1, "rgba(210, 240, 255, 0)");

    context.strokeStyle = gradient;
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(8, 3);
    context.lineTo(8, 73);
    context.stroke();

    return canvas;
  }

  private createOvercastShader() {
    return `#version 300 es
      precision highp float;

      uniform sampler2D colorTexture;
      uniform float opacity;
      uniform float speed;
      uniform float density;

      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float rippleLayer(vec2 uv, float time) {
        vec2 cellUv = uv * vec2(22.0, 13.0) * max(density * 0.56, 0.9);
        vec2 cell = floor(cellUv);
        vec2 local = fract(cellUv) - 0.5;
        float rnd = hash(cell);
        float phase = fract(time * (0.94 + rnd * 0.58) + rnd);
        float radius = phase * 0.44;
        float ring = smoothstep(0.018, 0.0, abs(length(local) - radius));
        float drop = smoothstep(0.12, 0.64, rnd);
        return ring * (1.0 - phase) * drop;
      }

      void main(void) {
        vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
        float time = czm_frameNumber / speed;
        float strength = clamp(opacity * 0.32, 0.13, 0.26);
        float gray = dot(sceneColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 desaturated = mix(sceneColor.rgb, vec3(gray), 0.22);
        vec3 coldGray = vec3(0.45, 0.5, 0.53);
        vec3 overcast = mix(desaturated * 0.9, coldGray, 0.1);
        float skyMask = smoothstep(0.72, 0.98, v_textureCoordinates.y);
        vec3 cloudGray = vec3(0.48, 0.52, 0.54);
        overcast = mix(overcast, cloudGray, skyMask * 0.26);

        float groundMask = 1.0 - smoothstep(0.52, 0.9, v_textureCoordinates.y);
        float ripple = rippleLayer(v_textureCoordinates, time);
        ripple += rippleLayer(v_textureCoordinates + vec2(4.7, 2.1), time * 1.28) * 0.62;
        ripple += rippleLayer(v_textureCoordinates * 1.37 + vec2(8.3, 5.6), time * 1.54) * 0.42;
        ripple *= groundMask * clamp(density * 0.22, 0.16, 0.68);

        vec3 wetScene = mix(overcast, vec3(0.58, 0.68, 0.72), groundMask * 0.08);
        wetScene += vec3(0.38, 0.52, 0.6) * ripple * opacity;

        fragColor = vec4(mix(sceneColor.rgb, wetScene, strength), sceneColor.a);
      }
    `;
  }

  private createSnowShader() {
    return `#version 300 es
      precision highp float;

      uniform sampler2D colorTexture;
      uniform float tiltAngle;
      uniform float size;
      uniform float speed;
      uniform float density;
      uniform float opacity;

      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float snowLayer(vec2 uv, float scale, float time, float fallSpeed, float radiusScale) {
        uv *= scale;
        vec2 cell = floor(uv);
        float rnd = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
        float sway = sin(time * (0.8 + rnd) + rnd * 6.2831) * 0.32;
        vec2 drift = vec2(sway + tiltAngle * time * 0.36, time * fallSpeed * (0.62 + rnd * 0.76));
        vec2 local = fract(uv + drift) - 0.5;
        local.x *= 0.86 + rnd * 0.34;
        float radius = mix(0.034, 0.078, rnd) * size * radiusScale;
        float core = smoothstep(radius, 0.0, length(local));
        float glow = smoothstep(radius * 2.4, 0.0, length(local)) * 0.26;
        return (core + glow) * (0.42 + rnd * 0.58);
      }

      void main(void) {
        vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
        vec2 resolution = czm_viewport.zw;
        vec2 uv = gl_FragCoord.xy / min(resolution.x, resolution.y);
        float time = czm_frameNumber / speed;
        float vertical = v_textureCoordinates.y;
        float farMask = smoothstep(0.18, 0.52, vertical);
        float nearMask = 1.0 - smoothstep(0.08, 0.68, vertical);
        float horizonMask = smoothstep(0.2, 0.48, vertical) * (1.0 - smoothstep(0.74, 0.96, vertical));

        float farSnow = 0.0;
        farSnow += snowLayer(uv + vec2(3.1, 9.7), 92.0 * density, time * 1.5, 1.28, 0.42);
        farSnow += snowLayer(uv + vec2(11.4, 2.6), 140.0 * density, time * 1.8, 1.46, 0.32) * 0.62;
        farSnow += snowLayer(uv + vec2(5.8, 14.2), 188.0 * density, time * 2.15, 1.74, 0.24) * 0.36;

        float midSnow = 0.0;
        midSnow += snowLayer(uv, 24.0 * density, time, 0.82, 0.72);
        midSnow += snowLayer(uv + 7.3, 38.0 * density, time * 1.18, 1.04, 0.6) * 0.7;

        float nearSnow = snowLayer(uv + 3.9, 16.0 * density, time * 0.78, 0.66, 1.06);
        float snow = farSnow * (0.62 + farMask * 0.76 + horizonMask * 0.24);
        snow += midSnow * (0.42 + horizonMask * 0.42);
        snow += nearSnow * nearMask * 0.36;
        snow = clamp(snow, 0.0, 1.0);

        float distanceVeil = opacity * (0.04 + farMask * 0.08 + horizonMask * 0.04);
        vec3 coldScene = mix(sceneColor.rgb, vec3(0.72, 0.82, 0.9), opacity * 0.16);
        coldScene = mix(coldScene, vec3(0.74, 0.82, 0.88), distanceVeil);
        vec3 snowColor = vec3(0.9, 0.96, 1.0);

        fragColor = vec4(mix(coldScene, snowColor, snow * opacity * 0.74), sceneColor.a);
      }
    `;
  }

  private createWindShader() {
    return `#version 300 es
      precision highp float;

      uniform sampler2D colorTexture;
      uniform float tiltAngle;
      uniform float size;
      uniform float speed;
      uniform float density;
      uniform float opacity;

      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main(void) {
        vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
        vec2 resolution = czm_viewport.zw;
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float time = czm_frameNumber / speed;
        float angle = tiltAngle - 0.42;
        float si = sin(angle);
        float co = cos(angle);

        uv *= mat2(co, -si, si, co);
        vec2 gustUv = vec2(uv.x * 12.0 * density - time * 9.0, uv.y * 42.0);
        vec2 cell = floor(gustUv);
        float rnd = hash(cell);
        float band = smoothstep(0.08 * size, 0.0, abs(fract(gustUv.y + rnd) - 0.5));
        float dash = smoothstep(0.74, 1.0, fract(gustUv.x + rnd * 3.0));
        float gust = band * dash * (0.36 + rnd * 0.64);

        vec3 haze = vec3(0.62, 0.72, 0.76);
        vec3 windLine = vec3(0.82, 0.93, 1.0) * gust;
        vec3 weather = mix(sceneColor.rgb, haze, opacity * 0.16) + windLine * opacity;

        fragColor = vec4(weather, sceneColor.a);
      }
    `;
  }
}
