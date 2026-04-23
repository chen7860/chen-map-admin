import * as Cesium from 'cesium';
// 闭合曲面
class DrawClosedCurve {
  viewer;
  Cesium;
  handler;
  floatingPoint; //标识点
  curveGeojson;
  bgColor;
  _ClosedCurve; //活动闭合曲面
  _ClosedCurveLast; //最后一个闭合曲面
  _positions; //活动点
  _entities_point; //脏数据
  _entities_ClosedCurve; //脏数据
  _ClosedCurveData; //用于构造闭合曲面数据
  ZERO_TOLERANCE;
  FITTING_COUNT;
  t;
  objId;
  DrawStartEvent; //开始绘制事件
  DrawEndEvent; //结束绘制事件
  constructor() {
    this.viewer = window.viewer;
    this.Cesium = Cesium;
    this.floatingPoint = null; //标识点
    // 曲面的geojson
    this.curveGeojson = null;
    this.bgColor = null;
    this._ClosedCurve = null; //活动闭合曲面
    this._ClosedCurveLast = null; //最后一个闭合曲面
    this._positions = []; //活动点
    this._entities_point = []; //脏数据
    this._entities_ClosedCurve = []; //脏数据
    this._ClosedCurveData = null; //用于构造闭合曲面数据
    this.ZERO_TOLERANCE = 0.0001;
    this.FITTING_COUNT = 100;
    this.t = 0.3;
    this.objId = Number(new Date().getTime() + '' + Number(Math.random() * 1000).toFixed(0));
    this.DrawStartEvent = new Cesium.Event(); //开始绘制事件
    this.DrawEndEvent = new Cesium.Event(); //结束绘制事件
  }

  //返回闭合曲面
  get ClosedCurve() {
    return this._ClosedCurveLast;
  }

  //返回闭合曲面数据用于加载闭合曲面
  getData() {
    return this._ClosedCurveData;
  }

  // 修改编辑调用计算
  computePosition(data) {
    if (data.length < 2) return;
    const pnts: [number, number][] = [];
    for (let p = 0; p < data.length; p++) {
      pnts.push(this.cartesianToLatlng(data[p]));
    }
    this._ClosedCurveData = Array.from(pnts);
    pnts.push(pnts[0], pnts[1]);
    let normals = [];
    const pList = [];
    for (let i = 0; i < pnts.length - 2; i++) {
      const normalPoints = this.getBisectorNormals(this.t, pnts[i], pnts[i + 1], pnts[i + 2]);
      normals = normals.concat(normalPoints);
    }
    const count = normals.length;
    normals = [normals[count - 1]].concat(normals.slice(0, count - 1));
    for (let i = 0; i < pnts.length - 2; i++) {
      const pnt1 = pnts[i];
      const pnt2 = pnts[i + 1];
      pList.push(this.LatlngTocartesian(pnt1));
      for (let t = 0; t <= this.FITTING_COUNT; t++) {
        const pnt = this.getCubicValue(
          t / this.FITTING_COUNT,
          pnt1,
          normals[i * 2],
          normals[i * 2 + 1],
          pnt2,
        );
        pList.push(this.LatlngTocartesian(pnt));
      }
      pList.push(this.LatlngTocartesian(pnt2));
    }
    const PolygonHierarchy = new this.Cesium.PolygonHierarchy(pList);
    return { PolygonHierarchy, pList };
  }

  //加载闭合曲面
  addload(data) {
    if (data.length < 2) return;
    const pnts = Array.from(data);
    pnts.push(pnts[0], pnts[1]);
    let normals = [];
    const pList = [];
    for (let i = 0; i < pnts.length - 2; i++) {
      const normalPoints = this.getBisectorNormals(this.t, pnts[i], pnts[i + 1], pnts[i + 2]);
      normals = normals.concat(normalPoints);
    }
    const count = normals.length;
    normals = [normals[count - 1]].concat(normals.slice(0, count - 1));
    for (let i = 0; i < pnts.length - 2; i++) {
      const pnt1 = pnts[i];
      const pnt2 = pnts[i + 1];
      pList.push(this.LatlngTocartesian(pnt1));
      for (let t = 0; t <= this.FITTING_COUNT; t++) {
        const pnt = this.getCubicValue(
          t / this.FITTING_COUNT,
          pnt1,
          normals[i * 2],
          normals[i * 2 + 1],
          pnt2,
        );
        pList.push(this.LatlngTocartesian(pnt));
      }
      pList.push(this.LatlngTocartesian(pnt2));
    }
    const arrowEntity = this.viewer.entities.add({
      Type: 'DrawClosedCurve',
      Position: data,
      id: data.id || this.objId,
      polygon: {
        hierarchy: new this.Cesium.PolygonHierarchy(pList),
        show: true,
        fill: true,
        clampToGround: true,
        material: this.bgColor,
      },
      polyline: {
        positions: pList,
        show: true,
        // 绘制黄色实线
        material: Cesium.Color.YELLOW,
        // material: new Cesium.PolylineDashMaterialProperty({
        //     color: Cesium.Color.YELLOW,
        // }),
        width: 2,
        clampToGround: true,
      },
    });
    const lnglatArr = [];
    // 转成经纬度
    for (let i = 0; i < pList.length; i++) {
      const lnglat = this.cartesianToLatlng(pList[i]);
      lnglatArr.push(lnglat);
    }
    this.curveGeojson = JSON.stringify({
      type: 'Polygon',
      coordinates: [lnglatArr],
    });
    return arrowEntity;
  }

  //开始创建
  startCreate(bgColor, callback) {
    this.curveGeojson = null;
    this.bgColor = Cesium.Color.fromCssColorString(bgColor).withAlpha(0.5);
    this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((evt) => {
      //单机开始绘制
      //屏幕坐标转地形上坐标
      const cartesian = this.getCatesian3FromPX(evt.position);
      if (this._positions.length == 0) {
        this.floatingPoint = this.createPoint(cartesian);
      }
      this._positions.push(cartesian);
      this.createPoint(cartesian);
    }, this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.setInputAction((evt) => {
      //移动时绘制面
      if (this._positions.length < 2) return;
      const cartesian = this.getCatesian3FromPX(evt.endPosition);
      if (this._positions.length == 2) {
        this._positions.push(cartesian);
      }
      this._positions.pop();
      this._positions.push(cartesian);
      if (!this.Cesium.defined(this._ClosedCurve)) {
        this._ClosedCurve = this.createClosedCurve();
      }
    }, this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler.setInputAction((evt) => {
      if (!this._ClosedCurve) return;
      const cartesian = this.getCatesian3FromPX(evt.position);
      this._positions.pop();
      this._positions.push(cartesian);
      this._ClosedCurveData = this._positions.concat();
      this.viewer.entities.remove(this._ClosedCurve); //移除
      this._ClosedCurve = null;
      this._positions = [];
      this.floatingPoint.position.setValue(cartesian);
      const lnglatArr = [];
      for (let i = 0; i < this._ClosedCurveData.length; i++) {
        const lnglat = this.cartesianToLatlng(this._ClosedCurveData[i]);
        lnglatArr.push(lnglat);
      }
      this._ClosedCurveData = lnglatArr;
      const ClosedCurve = this.addload(lnglatArr); //加载
      this._entities_ClosedCurve.push(ClosedCurve);
      this._ClosedCurveLast = ClosedCurve;
      this.clearPoint();
      this.destroy();
      callback(this.curveGeojson);
    }, this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //创建直线闭合曲面
  createClosedCurve() {
    // console.log(this._positions)

    this.pLists = '';
    const arrowEntity = this.viewer.entities.add({
      polygon: {
        hierarchy: new this.Cesium.CallbackProperty(() => {
          if (this._positions.length < 2) return;
          const pnts = [];
          for (let p = 0; p < this._positions.length; p++) {
            pnts.push(this.cartesianToLatlng(this._positions[p]));
          }
          pnts.push(pnts[0], pnts[1]);
          let normals = [];
          const pList = [];
          for (let i = 0; i < pnts.length - 2; i++) {
            const normalPoints = this.getBisectorNormals(this.t, pnts[i], pnts[i + 1], pnts[i + 2]);
            normals = normals.concat(normalPoints);
          }
          const count = normals.length;
          normals = [normals[count - 1]].concat(normals.slice(0, count - 1));
          for (let i = 0; i < pnts.length - 2; i++) {
            const pnt1 = pnts[i];
            const pnt2 = pnts[i + 1];
            pList.push(this.LatlngTocartesian(pnt1));
            for (let t = 0; t <= this.FITTING_COUNT; t++) {
              const pnt = this.getCubicValue(
                t / this.FITTING_COUNT,
                pnt1,
                normals[i * 2],
                normals[i * 2 + 1],
                pnt2,
              );
              pList.push(this.LatlngTocartesian(pnt));
            }
            pList.push(this.LatlngTocartesian(pnt2));
          }
          this.pLists = pList;
          return new this.Cesium.PolygonHierarchy(pList);
        }, false),
        show: true,
        fill: true,
        clampToGround: true,
        material: this.bgColor,
      },
      polyline: {
        positions: new this.Cesium.CallbackProperty(() => {
          return this.pLists;
        }, false),
        show: true,
        material: Cesium.Color.YELLOW,
        width: 2,
        clampToGround: true,
      },
    });

    this._entities_ClosedCurve.push(arrowEntity);
    return arrowEntity;
  }

  //创建点
  createPoint(cartesian) {
    const point = this.viewer.entities.add({
      position: cartesian,
      point: {
        pixelSize: 5,
        color: this.Cesium.Color.YELLOW,
      },
    });
    this._entities_point.push(point);
    return point;
  }

  /**
   * 世界坐标转经纬度
   */
  cartesianToLatlng(cartesian): [number, number] {
    const latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    const lat = this.Cesium.Math.toDegrees(latlng.latitude);
    const lng = this.Cesium.Math.toDegrees(latlng.longitude);
    return [lng, lat];
  }

  /**
   * 经纬度转世界坐标
   */
  LatlngTocartesian(latlng) {
    const cartesian3 = this.Cesium.Cartesian3.fromDegrees(latlng[0], latlng[1]);
    return cartesian3;
  }

  /**
   * 经纬度坐标转墨卡托坐标
   */
  // 墨卡托坐标系：展开地球，赤道作为x轴，向东为x轴正方，本初子午线作为y轴，向北为y轴正方向。
  // 数字20037508.34是地球赤道周长的一半：地球半径6378137米，赤道周长2*PI*r = 2 * 20037508.3427892，墨卡托坐标x轴区间[-20037508.3427892,20037508.3427892]
  lonLatToMercator(Latlng) {
    const E = Latlng[0];
    const N = Latlng[1];
    const x = (E * 20037508.34) / 180;
    let y = Math.log(Math.tan(((90 + N) * Math.PI) / 360)) / (Math.PI / 180);
    y = (y * 20037508.34) / 180;
    return [x, y];
  }
  /**
   * 墨卡托坐标转经纬度坐标转
   */
  WebMercator2lonLat(mercator) {
    const x = (mercator[0] / 20037508.34) * 180;
    const ly = (mercator[1] / 20037508.34) * 180;
    const y = (180 / Math.PI) * (2 * Math.atan(Math.exp((ly * Math.PI) / 180)) - Math.PI / 2);
    return [x, y];
  }

  //销毁
  destroy() {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }

  clearPoint() {
    this.DrawEndEvent.raiseEvent(this._ClosedCurveLast, this._ClosedCurveData);
    for (let i = 0; i < this._entities_point.length; i++) {
      this.viewer.entities.remove(this._entities_point[i]);
    }
    this._entities_point = []; //脏数据
  }

  //清空实体对象
  clear() {
    for (let i = 0; i < this._entities_point.length; i++) {
      this.viewer.entities.remove(this._entities_point[i]);
    }
    for (let i = 0; i < this._entities_ClosedCurve.length; i++) {
      this.viewer.entities.remove(this._entities_ClosedCurve[i]);
    }
    this.floatingPoint = null; //标识点
    this._ClosedCurve = null; //活动闭合曲面
    this._ClosedCurveLast = null; //最后一个闭合曲面
    this._positions = []; //活动点
    this._entities_point = []; //脏数据
    this._entities_ClosedCurve = []; //脏数据
    this._ClosedCurveData = null; //用于构造闭合曲面数据
  }

  getCatesian3FromPX(px) {
    const ray = this.viewer.camera.getPickRay(px);
    if (!ray) return null;
    const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    return cartesian;
  }

  // 求取闭合曲面坐标函数/
  //闭合曲面配置函数
  /**
   * getBisectorNormals
   * @param t
   * @param pnt1
   * @param pnt2
   * @param pnt3
   * @returns {[*,*]}
   */
  getBisectorNormals(t, pnt1, pnt2, pnt3) {
    const normal = this.getNormal(pnt1, pnt2, pnt3);
    let [bisectorNormalRight, bisectorNormalLeft, dt, x, y] = [[0, 0], [0, 0], 0, 0, 0];
    const dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
    const uX = normal[0] / dist;
    const uY = normal[1] / dist;
    const d1 = this.MathDistance(pnt1, pnt2);
    const d2 = this.MathDistance(pnt2, pnt3);

    if (dist > this.ZERO_TOLERANCE) {
      if (this.isClockWise(pnt1, pnt2, pnt3)) {
        dt = t * d1;
        x = pnt2[0] - dt * uY;
        y = pnt2[1] + dt * uX;
        bisectorNormalRight = [x, y];
        dt = t * d2;
        x = pnt2[0] + dt * uY;
        y = pnt2[1] - dt * uX;
        bisectorNormalLeft = [x, y];
      } else {
        dt = t * d1;
        x = pnt2[0] + dt * uY;
        y = pnt2[1] - dt * uX;
        bisectorNormalRight = [x, y];
        dt = t * d2;
        x = pnt2[0] - dt * uY;
        y = pnt2[1] + dt * uX;
        bisectorNormalLeft = [x, y];
      }
    } else {
      x = pnt2[0] + t * (pnt1[0] - pnt2[0]);
      y = pnt2[1] + t * (pnt1[1] - pnt2[1]);
      bisectorNormalRight = [x, y];
      x = pnt2[0] + t * (pnt3[0] - pnt2[0]);
      y = pnt2[1] + t * (pnt3[1] - pnt2[1]);
      bisectorNormalLeft = [x, y];
    }
    return [bisectorNormalRight, bisectorNormalLeft];
  }

  /**
   * 获取默认三点的内切圆
   * @param pnt1
   * @param pnt2
   * @param pnt3
   * @returns {[*,*]}
   */
  getNormal(pnt1, pnt2, pnt3) {
    let dX1 = pnt1[0] - pnt2[0];
    let dY1 = pnt1[1] - pnt2[1];
    const d1 = Math.sqrt(dX1 * dX1 + dY1 * dY1);
    dX1 /= d1;
    dY1 /= d1;
    let dX2 = pnt3[0] - pnt2[0];
    let dY2 = pnt3[1] - pnt2[1];
    const d2 = Math.sqrt(dX2 * dX2 + dY2 * dY2);
    dX2 /= d2;
    dY2 /= d2;
    const uX = dX1 + dX2;
    const uY = dY1 + dY2;
    return [uX, uY];
  }

  /**
   * 计算两个坐标之间的距离
   * @param pnt1
   * @param pnt2
   * @returns {number}
   * @constructor
   */
  MathDistance(pnt1, pnt2) {
    return Math.sqrt(Math.pow(pnt1[0] - pnt2[0], 2) + Math.pow(pnt1[1] - pnt2[1], 2));
  }

  /**
   * 判断是否是顺时针
   * @param pnt1
   * @param pnt2
   * @param pnt3
   * @returns {boolean}
   */
  isClockWise(pnt1, pnt2, pnt3) {
    return (pnt3[1] - pnt1[1]) * (pnt2[0] - pnt1[0]) > (pnt2[1] - pnt1[1]) * (pnt3[0] - pnt1[0]);
  }

  /**
   * 获取立方值
   * @param t
   * @param startPnt
   * @param cPnt1
   * @param cPnt2
   * @param endPnt
   * @returns {[*,*]}
   */
  getCubicValue(t, startPnt, cPnt1, cPnt2, endPnt) {
    t = Math.max(Math.min(t, 1), 0);
    const [tp, t2] = [1 - t, t * t];
    const t3 = t2 * t;
    const tp2 = tp * tp;
    const tp3 = tp2 * tp;
    const x = tp3 * startPnt[0] + 3 * tp2 * t * cPnt1[0] + 3 * tp * t2 * cPnt2[0] + t3 * endPnt[0];
    const y = tp3 * startPnt[1] + 3 * tp2 * t * cPnt1[1] + 3 * tp * t2 * cPnt2[1] + t3 * endPnt[1];
    return [x, y];
  }
}

export default DrawClosedCurve;
