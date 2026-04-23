var g=Object.defineProperty;var p=(n,t,i)=>t in n?g(n,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):n[t]=i;var s=(n,t,i)=>p(n,typeof t!="symbol"?t+"":t,i);import{R as S}from"./index-Cpzbgz7m.js";import{d as _,f as w,g as x,c as u,o as d,b as c,a as C,F as z,j as y,u as b,n as A,t as R,m as k,_ as B}from"./index-CS7Y3inQ.js";class M{constructor(t,i){s(this,"tiltAngle");s(this,"rainSize");s(this,"rainSpeed");s(this,"viewer");s(this,"rainStage");var e,r,o;if(!t)throw new Error("no viewer object!");i=i||{},this.tiltAngle=(e=i.tiltAngle)!=null?e:-.6,this.rainSize=(r=i.rainSize)!=null?r:.3,this.rainSpeed=(o=i.rainSpeed)!=null?o:60,this.viewer=t,this.init()}init(){this.rainStage=new Cesium.PostProcessStage({name:"czm_rain",fragmentShader:this.rain(),uniforms:{tiltAngle:()=>this.tiltAngle,rainSize:()=>this.rainSize,rainSpeed:()=>this.rainSpeed}}),this.viewer.scene.postProcessStages.add(this.rainStage)}destroy(){!this.viewer||!this.rainStage||(this.viewer.scene.postProcessStages.remove(this.rainStage),delete this.tiltAngle,delete this.rainSize,delete this.rainSpeed)}show(t){this.rainStage.enabled=t}rain(){return`#version 300 es
            precision highp float;
            uniform sampler2D colorTexture;
            in vec2 v_textureCoordinates;
            uniform float tiltAngle;
            uniform float rainSize;
            uniform float rainSpeed;
            out vec4 fragColor;
            
            float hash(float x) {
                return fract(sin(x * 133.3) * 13.13);
            }
            void main(void) {
                float time = czm_frameNumber / rainSpeed;
                vec2 resolution = czm_viewport.zw;
                vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
                vec3 c = vec3(0.6, 0.7, 0.8);
                float a = tiltAngle;
                float si = sin(a), co = cos(a);
                uv *= mat2(co, -si, si, co);
                uv *= length(uv + vec2(0.0, 4.9)) * rainSize + 1.0;
                float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
                float b = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
                c *= v * b;
                fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1.0), 0.5);
            }
            `}}Cesium.Material.RainEffect=M;class P{constructor(){s(this,"effect")}start(t){this.stop(),this.effect=new Cesium.Material.RainEffect(window.viewer,t)}stop(){this.effect&&this.effect.destroy()}}const F={class:"cesium-page"},N={class:"tool"},T={class:"list"},j=["onClick"],D=_({name:"CesiumRain",__name:"index",setup(n){const t=["小雨","中雨","大雨"],i=w("");let e=null,r=!1;function o(){e||(e=new P)}function h(a){if(!r){k("地图尚未初始化完成",{type:"warning"});return}switch(o(),a){case"小雨":e==null||e.start({tiltAngle:-.1,rainSize:1,rainSpeed:120});break;case"中雨":e==null||e.start({tiltAngle:-.1,rainSize:.6,rainSpeed:120});break;case"大雨":e==null||e.start({tiltAngle:-.1,rainSize:.2,rainSpeed:120});break}i.value=a}function v(){e==null||e.stop(),i.value=""}function f(a){window.viewer=a,r=!0}function m(a){console.error("Cesium rain init failed",a)}return x(()=>{e==null||e.stop(),r=!1}),(a,L)=>(d(),u("div",F,[c("div",N,[c("div",T,[(d(),u(z,null,y(t,l=>c("div",{key:l,class:A({item:!0,active:i.value===l}),onClick:V=>h(l)},R(l),11,j)),64))]),c("div",{class:"clear",onClick:v},"关闭")]),C(b(S),{height:"calc(100vh - 150px)",onReady:f,onError:m})]))}}),q=B(D,[["__scopeId","data-v-05d4b932"]]);export{q as default};
