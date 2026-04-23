import * as Cesium from 'cesium';
export default class Rectangle {
  viewer;
  config;
  infoDetail;
  handler;
  entity;
  constructor() {
    /**cesium实例对象 */
    this.viewer = window.viewer;
    /**绘制要素的相关配置
       * 默认配置
       * {
          borderColor: Cesium.Color.BLUE,  边框颜色
          borderWidth: 2, 边框宽度
          material: Cesium.Color.GREEN.withAlpha(0.5),填充材质
      }
      */
    this.config = {
      borderColor: Cesium.Color.YELLOW,
      borderWidth: 2,
      material: Cesium.Color.fromCssColorString('#7F4538').withAlpha(0.5),
    };
    /**存贮绘制的数据 坐标 */
    this.infoDetail = { point: [], line: [], rectangle: [], circle: [], planeSelf: [] };
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  }

  /*******
   * @function: function
   * @description: 绘制矩形区域
   * @return {*}
   * @author: xk
   */
  drawRectangle() {
    this.handler.destroy();
    /**
     * 矩形四点坐标
     */
    let westSouthEastNorth: number[] = [];
    /**实体的唯一标注 */
    let id = new Date().getTime();
    /**地图点击对象 */
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((click) => {
      /**点击位置笛卡尔坐标 */
      const cartesian = this.viewer.camera.pickEllipsoid(
        click.position,
        this.viewer.scene.globe.ellipsoid,
      );
      /**笛卡尔转弧度坐标 */
      const cartographic = Cesium.Cartographic.fromCartesian(
        cartesian,
        this.viewer.scene.globe.ellipsoid,
        new Cesium.Cartographic(),
      );
      /**点击位置经度 */
      const lng1 = Cesium.Math.toDegrees(cartographic.longitude);
      /**点击位置维度 */
      const lat1 = Cesium.Math.toDegrees(cartographic.latitude);
      /**边框坐标 */
      westSouthEastNorth = [lng1, lat1];
      id = new Date().getTime();
      if (westSouthEastNorth) {
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }
      /**面实例对象 */
      this.entity = this.viewer.entities.add({
        name: 'rectangle',
        id: id,
        polygon: {
          hierarchy: new Cesium.CallbackProperty(function () {
            return {
              positions: Cesium.Cartesian3.fromDegreesArray(westSouthEastNorth),
            };
          }, false),
          height: 0,
          // 填充的颜色，withAlpha透明度
          material: this.config.material,
          // 是否被提供的材质填充
          fill: true,
          // 是否显示
          show: true,
        },
        polyline: {
          positions: new Cesium.CallbackProperty(function () {
            return Cesium.Cartesian3.fromDegreesArray(westSouthEastNorth);
          }, false),
          material: this.config.borderColor,
          width: this.config.borderWidth,
          zIndex: 1,
        },
      });
      this.handler.setInputAction((move) => {
        const cartesian = this.viewer.camera.pickEllipsoid(
          move.endPosition,
          this.viewer.scene.globe.ellipsoid,
        );
        const cartographic = Cesium.Cartographic.fromCartesian(
          cartesian,
          this.viewer.scene.globe.ellipsoid,
          new Cesium.Cartographic(),
        );
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);

        westSouthEastNorth = [lng1, lat1, lng1, lat, lng, lat, lng, lat1, lng1, lat1];
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.handler.setInputAction(() => {
      this.handler.destroy();
      this.infoDetail.rectangle.push({ id: id, position: westSouthEastNorth });
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  // 清除矩形
  clear() {
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
    }
  }

  /*******
   * @function: function
   * @return {*}
   * @author: xk
   * @description: 返回绘制数据
   */
  backInfoDetail() {
    return this.infoDetail;
  }
}
