var S=Object.defineProperty;var C=(l,t,e)=>t in l?S(l,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[t]=e;var n=(l,t,e)=>C(l,typeof t!="symbol"?t+"":t,e);import{R as w}from"./index-oKoCQ0Jj.js";import{d as x,i as b,k as _,c as f,o as p,b as m,a as M,F as z,r as k,u as R,p as E,t as L,m as A,_ as B}from"./index-DWRbWuuN.js";class D{constructor(t,e){n(this,"viewer");n(this,"stage",null);n(this,"options");n(this,"sceneState",null);n(this,"particleSystem",null);n(this,"particleDown",new Cesium.Cartesian3);n(this,"particleModelMatrix",new Cesium.Matrix4);n(this,"particleWind",new Cesium.Cartesian3);n(this,"updateRainEmitter",()=>{this.updateRainEmitterPosition()});var i,s,r,o,h;if(!t)throw new Error("no viewer object!");this.viewer=t,this.options={type:e.type,tiltAngle:(i=e.tiltAngle)!=null?i:-.28,size:(s=e.size)!=null?s:.5,speed:(r=e.speed)!=null?r:80,density:(o=e.density)!=null?o:1,opacity:(h=e.opacity)!=null?h:.5},this.stage=new Cesium.PostProcessStage({name:`czm_${this.options.type}_weather`,fragmentShader:this.createShader(),uniforms:{tiltAngle:()=>this.options.tiltAngle,size:()=>this.options.size,speed:()=>this.options.speed,density:()=>this.options.density,opacity:()=>this.options.opacity}}),this.viewer.scene.postProcessStages.add(this.stage),this.options.type==="rain"&&(this.applyOvercastScene(),this.createRainParticles(),this.viewer.scene.preRender.addEventListener(this.updateRainEmitter))}destroy(){this.viewer&&(this.viewer.scene.preRender.removeEventListener(this.updateRainEmitter),this.particleSystem&&(this.viewer.scene.primitives.remove(this.particleSystem),this.particleSystem=null),this.stage&&(this.viewer.scene.postProcessStages.remove(this.stage),this.stage=null),this.restoreScene())}show(t){this.stage&&(this.stage.enabled=t),this.particleSystem&&(this.particleSystem.show=t)}createShader(){return this.options.type==="rain"?this.createOvercastShader():this.options.type==="snow"?this.createSnowShader():this.createWindShader()}applyOvercastScene(){const{scene:t}=this.viewer,{fog:e,atmosphere:i,skyAtmosphere:s}=t;this.sceneState={fogEnabled:e.enabled,fogRenderable:e.renderable,fogDensity:e.density,fogVisualDensityScalar:e.visualDensityScalar,fogMaxHeight:e.maxHeight,fogMinimumBrightness:e.minimumBrightness,skyHueShift:s==null?void 0:s.hueShift,skySaturationShift:s==null?void 0:s.saturationShift,skyBrightnessShift:s==null?void 0:s.brightnessShift,atmosphereHueShift:i.hueShift,atmosphereSaturationShift:i.saturationShift,atmosphereBrightnessShift:i.brightnessShift},e.enabled=this.sceneState.fogEnabled,e.renderable=this.sceneState.fogRenderable,e.density=this.sceneState.fogDensity,e.visualDensityScalar=this.sceneState.fogVisualDensityScalar,e.maxHeight=this.sceneState.fogMaxHeight,e.minimumBrightness=this.sceneState.fogMinimumBrightness,i.saturationShift=-.26,i.brightnessShift=-.05,s&&(s.saturationShift=-.68,s.brightnessShift=-.12)}restoreScene(){var r,o,h;if(!this.sceneState||this.viewer.isDestroyed())return;const{scene:t}=this.viewer,{fog:e,atmosphere:i,skyAtmosphere:s}=t;e.enabled=this.sceneState.fogEnabled,e.renderable=this.sceneState.fogRenderable,e.density=this.sceneState.fogDensity,e.visualDensityScalar=this.sceneState.fogVisualDensityScalar,e.maxHeight=this.sceneState.fogMaxHeight,e.minimumBrightness=this.sceneState.fogMinimumBrightness,i.hueShift=this.sceneState.atmosphereHueShift,i.saturationShift=this.sceneState.atmosphereSaturationShift,i.brightnessShift=this.sceneState.atmosphereBrightnessShift,s&&(s.hueShift=(r=this.sceneState.skyHueShift)!=null?r:s.hueShift,s.saturationShift=(o=this.sceneState.skySaturationShift)!=null?o:s.saturationShift,s.brightnessShift=(h=this.sceneState.skyBrightnessShift)!=null?h:s.brightnessShift),this.sceneState=null}createRainParticles(){const t=this.options.density,e=this.createRainParticleImage();this.particleSystem=this.viewer.scene.primitives.add(new Cesium.ParticleSystem({image:e,emitter:new Cesium.BoxEmitter(new Cesium.Cartesian3(13e3,9500,2200)),modelMatrix:this.particleModelMatrix,emissionRate:980*t,lifetime:Number.MAX_VALUE,minimumParticleLife:1,maximumParticleLife:1.9,minimumSpeed:1,maximumSpeed:1,startColor:Cesium.Color.fromCssColorString("#e8f6ff").withAlpha(.68),endColor:Cesium.Color.fromCssColorString("#dcefff").withAlpha(.16),minimumImageSize:new Cesium.Cartesian2(8,34),maximumImageSize:new Cesium.Cartesian2(16,72),sizeInMeters:!1,updateCallback:i=>{Cesium.Cartesian3.multiplyByScalar(this.particleDown,1250+this.options.speed*5,i.velocity),Cesium.Cartesian3.add(i.velocity,this.particleWind,i.velocity)}})),this.updateRainEmitterPosition()}updateRainEmitterPosition(){if(!this.particleSystem||this.viewer.isDestroyed())return;const t=this.viewer.camera,e=t.positionWC,i=Cesium.Cartesian3.normalize(e,new Cesium.Cartesian3),s=Cesium.Cartesian3.clone(t.rightWC,new Cesium.Cartesian3),r=Cesium.Cartesian3.clone(t.directionWC,new Cesium.Cartesian3),o=new Cesium.Cartesian3;Cesium.Cartesian3.multiplyByScalar(i,1300,o),Cesium.Cartesian3.add(e,o,o),Cesium.Cartesian3.multiplyByScalar(r,2100,r),Cesium.Cartesian3.add(o,r,o),this.particleModelMatrix=Cesium.Transforms.eastNorthUpToFixedFrame(o,void 0,this.particleModelMatrix),this.particleSystem.modelMatrix=this.particleModelMatrix,Cesium.Cartesian3.negate(i,this.particleDown),Cesium.Cartesian3.multiplyByScalar(s,Math.sin(this.options.tiltAngle)*460,this.particleWind)}createRainParticleImage(){const t=document.createElement("canvas");t.width=16,t.height=76;const e=t.getContext("2d");if(!e)return t;const i=e.createLinearGradient(8,0,8,76);return i.addColorStop(0,"rgba(210, 240, 255, 0)"),i.addColorStop(.24,"rgba(210, 240, 255, 0.18)"),i.addColorStop(.58,"rgba(240, 252, 255, 0.86)"),i.addColorStop(1,"rgba(210, 240, 255, 0)"),e.strokeStyle=i,e.lineWidth=2.4,e.lineCap="round",e.beginPath(),e.moveTo(8,3),e.lineTo(8,73),e.stroke(),t}createOvercastShader(){return`#version 300 es
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
    `}createSnowShader(){return`#version 300 es
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
    `}createWindShader(){return`#version 300 es
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
    `}}class T{constructor(t){n(this,"viewer");n(this,"effect",null);this.viewer=t}start(t){this.stop(),this.effect=new D(this.viewer,t)}stop(){var t;(t=this.effect)==null||t.destroy(),this.effect=null}}const P={class:"cesium-page"},H={class:"tool"},W={class:"list"},U=["onClick"],I=-16,V=1e3,F=x({name:"CesiumRain",__name:"index",setup(l){const t=[{label:"小雨",config:{type:"rain",tiltAngle:-.12,size:1,speed:125,density:1.2,opacity:.38}},{label:"中雨",config:{type:"rain",tiltAngle:-.18,size:.62,speed:105,density:1.9,opacity:.52}},{label:"大雨",config:{type:"rain",tiltAngle:-.26,size:.34,speed:78,density:3.1,opacity:.6}},{label:"小雪",config:{type:"snow",tiltAngle:-.12,size:1.22,speed:118,density:.98,opacity:.62}},{label:"大雪",config:{type:"snow",tiltAngle:-.24,size:1.12,speed:68,density:1.26,opacity:.66}},{label:"刮风",config:{type:"wind",tiltAngle:-.42,size:.88,speed:42,density:1.18,opacity:.62}}],e=b("");let i=null,s=null,r=!1;function o(a){if(!r){A("地图尚未初始化完成",{type:"warning"});return}i==null||i.start(a.config),h(a.config.type),e.value=a.label}function h(a){if(!s||a==="wind")return;const{camera:d}=s,c=Cesium.Cartographic.fromCartesian(d.positionWC),u=Math.min(c.height,V);d.flyTo({destination:Cesium.Cartesian3.fromRadians(c.longitude,c.latitude,u),orientation:{heading:d.heading,pitch:Cesium.Math.toRadians(I),roll:d.roll},duration:.6})}function v(){i==null||i.stop(),e.value=""}function g(a){s=a,i=new T(a),a.scene.backgroundColor=Cesium.Color.fromCssColorString("#07111f"),a.scene.globe.baseColor=Cesium.Color.fromCssColorString("#101c2c"),a.scene.skyAtmosphere.saturationShift=-.72,a.scene.skyAtmosphere.brightnessShift=-.42,a.scene.atmosphere.saturationShift=-.34,a.scene.atmosphere.brightnessShift=-.18,a.scene.fog.enabled=!0,a.scene.fog.density=42e-5,a.scene.fog.minimumBrightness=.02,a.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(113.150014,23.0498,4200),orientation:{heading:Cesium.Math.toRadians(0),pitch:Cesium.Math.toRadians(-42),roll:0},duration:0}),r=!0}function y(a){console.error("Cesium rain init failed",a)}return _(()=>{i==null||i.stop(),i=null,s=null,r=!1}),(a,d)=>(p(),f("div",P,[m("div",H,[m("div",W,[(p(),f(z,null,k(t,c=>m("div",{key:c.label,class:E({item:!0,active:e.value===c.label}),onClick:u=>o(c)},L(c.label),11,U)),64))]),m("div",{class:"clear",onClick:v},"关闭")]),M(R(w),{height:"calc(100vh - 150px)",onReady:g,onError:y})]))}}),X=B(F,[["__scopeId","data-v-6358df29"]]);export{X as default};
