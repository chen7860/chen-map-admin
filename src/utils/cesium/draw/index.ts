import Curve from './curve';
import Circle from './circle';
import Rectangle from './rectangle';

// 公共绘制
class BaseDraw {
  private curve: Curve;
  private circle: Circle;
  private rectangle: Rectangle;
  constructor() {
    this.curve = new Curve(); // 实例化曲线
    this.circle = new Circle(); // 实例化圆
    this.rectangle = new Rectangle(); // 实例化矩形
  }
  // 绘制曲线
  drawCurve(color, callback) {
    this.curve.startCreate(color, callback);
  }

  // 清除曲线
  clearCurve() {
    this.curve.clear();
  }

  // 绘制圆形
  drawCircle(color) {
    this.circle.startCreate(color);
  }

  // 清除圆形
  clearCircle() {
    this.circle.clear();
  }

  // 绘制矩形
  drawRectangle() {
    this.rectangle.drawRectangle();
  }

  // 清除矩形
  clearRectangle() {
    this.rectangle.clear();
  }

  // 清除全部图形
  clearAll() {
    this.clearCurve();
    this.clearCircle();
    this.clearRectangle();
  }
}

export default BaseDraw;
