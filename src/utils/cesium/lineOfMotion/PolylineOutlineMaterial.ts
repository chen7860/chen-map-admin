// @ts-nocheck
import arrow from "@/assets/images/arrow.png";
import * as Cesium from "cesium";

const defaultColor = Cesium.Color.TRANSPARENT;
const defaultImage = arrow;
const defaultImageimageW = 60; // 这里改成自己图片宽度
const defaultAnimation = false;
const defaultDuration = 3000;

interface ImageLineMaterialOptions {
  color?: any;
  backgroundColor?: any;
  image?: string;
  imageW?: number;
  animation?: boolean;
  duration?: number;
}

interface MaterialResult {
  color?: any;
  backgroundColor?: any;
  image?: string;
  imageW?: number;
  animation?: boolean;
  time?: number;
  [key: string]: any;
}

class ImageLineMaterial {
  _definitionChanged: any;
  _color: any;
  _colorSubscription: any;
  _backgroundColor: any;
  _backgroundColorSubscription: any;
  _image: any;
  _imageSubscription: any;
  _imageW: any;
  _imageWSubscription: any;
  _animation: any;
  _animationSubscription: any;
  _duration: any;
  _durationSubscription: any;
  _time: number | undefined;

  constructor(opt: ImageLineMaterialOptions = {}) {
    this._definitionChanged = new Cesium.Event();
    // 定义材质变量
    this._color = undefined;
    this._colorSubscription = undefined;
    this._backgroundColor = undefined;
    this._backgroundColorSubscription = undefined;
    this._image = undefined;
    this._imageSubscription = undefined;
    this._imageW = undefined;
    this._imageWSubscription = undefined;
    this._animation = undefined;
    this._animationSubscription = undefined;
    this._duration = undefined;
    this._durationSubscription = undefined;
    // 变量初始化
    this.color = opt.color || defaultColor; //颜色
    this.backgroundColor = opt.backgroundColor || defaultColor; //颜色
    this._image = opt.image || defaultImage; //材质图片
    this.imageW = opt.imageW || defaultImageimageW;
    this.animation = opt.animation || defaultAnimation;
    this.duration = opt.duration || defaultDuration;
    this._time = undefined;
  }

  get isConstant(): boolean {
    return false;
  }

  get definitionChanged(): any {
    return this._definitionChanged;
  }

  set color(value: any) {
    this._color = value;
  }

  get color(): any {
    return this._color;
  }

  set backgroundColor(value: any) {
    this._backgroundColor = value;
  }

  get backgroundColor(): any {
    return this._backgroundColor;
  }

  set image(value: string) {
    this._image = value;
  }

  get image(): string {
    return this._image;
  }

  set imageW(value: number) {
    this._imageW = value;
  }

  get imageW(): number {
    return this._imageW;
  }

  set animation(value: boolean) {
    this._animation = value;
  }

  get animation(): boolean {
    return this._animation;
  }

  set duration(value: number) {
    this._duration = value;
  }

  get duration(): number {
    return this._duration;
  }

  getType(): string {
    return "ImageLine";
  }

  getValue(time: number, result?: MaterialResult): MaterialResult {
    if (!Cesium.defined(result)) {
      result = {};
    }
    result.color = (Cesium.Property as any).getValueOrClonedDefault(
      this._color,
      time,
      defaultColor,
      result.color
    );
    result.backgroundColor = (Cesium.Property as any).getValueOrClonedDefault(
      this._backgroundColor,
      time,
      defaultColor,
      result.backgroundColor
    );
    result.image = this._image;
    result.imageW = this._imageW;
    result.animation = this._animation;
    if (this._time === undefined) {
      this._time = new Date().getTime();
    }
    result.time =
      ((new Date().getTime() - this._time) % this._duration) / this._duration;
    return result;
  }

  equals(other: any): boolean {
    return (
      this === other ||
      (other instanceof ImageLineMaterial &&
        (Cesium.Property as any).equals(this._color, other._color) &&
        (Cesium.Property as any).equals(
          this._backgroundColor,
          other._backgroundColor
        ))
    );
  }
}

// 注册 Cesium 属性描述符
const propertyDescriptor = (Cesium as any).createPropertyDescriptor;
if (propertyDescriptor) {
  Object.defineProperties(ImageLineMaterial.prototype, {
    color: propertyDescriptor("color"),
    backgroundColor: propertyDescriptor("backgroundColor"),
    image: propertyDescriptor("image"),
    imageW: propertyDescriptor("imageW"),
    animation: propertyDescriptor("animation"),
    duration: propertyDescriptor("duration")
  });
}

// 注册材质
(Cesium.Material as any)._materialCache.addMaterial("ImageLine", {
  fabric: {
    type: "ImageLine",
    uniforms: {
      // uniforms参数跟我们上面定义的参数以及getValue方法中返回的result对应，这里值是默认值
      color: new Cesium.Color(1, 0, 0, 1.0),
      backgroundColor: new Cesium.Color(0, 0, 0, 0.0),
      image: "",
      imageW: 1,
      animation: false,
      duration: 30,
      time: 0
    },
    // source编写glsl，可以使用uniforms参数，值来自getValue方法的result
    source: `
      in float v_polylineAngle;
      mat2 rotate(float rad) {
        float c = cos(rad);
        float s = sin(rad);
        return mat2(
            c, s,
            -s, c
        );
      }
      czm_material czm_getMaterial(czm_materialInput materialInput)
        {
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            vec2 pos = rotate(v_polylineAngle) * gl_FragCoord.xy;
            float s = pos.x / (imageW * czm_pixelRatio);
            float t = st.t;
            s = s-time;//增加运动效果
            vec4 colorImage = texture(image, vec2(fract(s), t));
            material.alpha = colorImage.a;
            material.diffuse = colorImage.rgb;
            return material;
        }
    `
  },
  translucent: function translucent() {
    return true;
  }
});
(Cesium.Material as any).ImageLineType = "ImageLine";
(Cesium.Material as any).ImageLineMaterialProperty = ImageLineMaterial;

export { ImageLineMaterial };
