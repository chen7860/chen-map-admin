import * as Cesium from "cesium";

class RainEffect {
  tiltAngle;
  rainSize;
  rainSpeed;
  viewer;
  rainStage;
  constructor(viewer, options) {
    if (!viewer) throw new Error("no viewer object!");
    options = options || {};
    //倾斜角度，负数向右，正数向左
    this.tiltAngle = options.tiltAngle ?? -0.6;
    this.rainSize = options.rainSize ?? 0.3;
    this.rainSpeed = options.rainSpeed ?? 60.0;
    this.viewer = viewer;
    this.init();
  }

  init() {
    this.rainStage = new Cesium.PostProcessStage({
      name: "czm_rain",
      fragmentShader: this.rain(),
      uniforms: {
        tiltAngle: () => {
          return this.tiltAngle;
        },
        rainSize: () => {
          return this.rainSize;
        },
        rainSpeed: () => {
          return this.rainSpeed;
        }
      }
    });
    this.viewer.scene.postProcessStages.add(this.rainStage);
  }

  destroy() {
    if (!this.viewer || !this.rainStage) return;
    this.viewer.scene.postProcessStages.remove(this.rainStage);
    delete this.tiltAngle;
    delete this.rainSize;
    delete this.rainSpeed;
  }

  show(visible) {
    this.rainStage.enabled = visible;
  }

  rain() {
    return "#version 300 es\n\
            precision highp float;\n\
            uniform sampler2D colorTexture;\n\
            in vec2 v_textureCoordinates;\n\
            uniform float tiltAngle;\n\
            uniform float rainSize;\n\
            uniform float rainSpeed;\n\
            out vec4 fragColor;\n\
            \n\
            float hash(float x) {\n\
                return fract(sin(x * 133.3) * 13.13);\n\
            }\n\
            void main(void) {\n\
                float time = czm_frameNumber / rainSpeed;\n\
                vec2 resolution = czm_viewport.zw;\n\
                vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);\n\
                vec3 c = vec3(0.6, 0.7, 0.8);\n\
                float a = tiltAngle;\n\
                float si = sin(a), co = cos(a);\n\
                uv *= mat2(co, -si, si, co);\n\
                uv *= length(uv + vec2(0.0, 4.9)) * rainSize + 1.0;\n\
                float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);\n\
                float b = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;\n\
                c *= v * b;\n\
                fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1.0), 0.5);\n\
            }\n\
            ";
  }
}

Cesium.Material.RainEffect = RainEffect;
