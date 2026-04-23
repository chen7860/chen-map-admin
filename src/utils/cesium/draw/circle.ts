import * as Cesium from 'cesium';

export default class drawCircle {
  handler!: Cesium.ScreenSpaceEventHandler;
  viewer: Cesium.Viewer;
  circle_center_entity: Cesium.Entity | null = null;
  temporary_circle_entity: Cesium.Entity | null = null;
  circle_entity: Cesium.Entity | null = null;
  circle_end_point: any = null;
  circle_center_point: any = null;
  bgColor: any;

  constructor() {
    this.viewer = window.viewer;
  }
  startCreate(bgColor) {
    this.bgColor = Cesium.Color.fromCssColorString(bgColor).withAlpha(0.5);
    // 再次点击的时候，清除已绘制的中心点，临时圆和结果圆，初始化参数
    this.clear();
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // 鼠标双击事件 结束绘制
    this.handler.setInputAction((event) => {
      // 屏幕坐标转为世界坐标
      const ray = this.viewer.camera.getPickRay(event.position);
      if (!ray) return; // 添加空值检查

      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      if (!cartesian) return; // 同样检查 cartesian

      const ellipsoid = this.viewer.scene.globe.ellipsoid;
      const cartographic = ellipsoid.cartesianToCartographic(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      if (this.circle_center_entity) {
        // 设置最终点
        this.circle_end_point = {
          lon: lon,
          lat: lat,
          height: 0,
        };
        // 绘制结果多边形
        this.draw_circle();
        // 清除事件
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        // 清除 绘制的中心点和临时圆
        this.viewer.entities.remove(this.circle_center_entity);
        if (this.temporary_circle_entity) {
          this.viewer.entities.remove(this.temporary_circle_entity);
        }
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // 鼠标点击左键
    this.handler.setInputAction((event) => {
      // 屏幕坐标转为世界坐标
      const ray = this.viewer.camera.getPickRay(event.position);
      if (!ray) return; // 添加空值检查

      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      if (!cartesian) return; // 同样检查 cartesian

      const ellipsoid = this.viewer.scene.globe.ellipsoid;
      const cartographic = ellipsoid.cartesianToCartographic(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      // 判断圆心是否已经绘制，如果绘制了，再次点击左键的时候，就是绘制最终结果圆形
      if (!this.circle_center_entity) {
        // 设置中心点坐标和结束点坐标
        this.circle_center_point = {
          lon: lon,
          lat: lat,
          height: 0,
        };
        // 绘制圆心点
        this.create_circle_center_point([lon, lat]);
        // 开始绘制动态圆形
        this.draw_dynamic_circle(this.circle_center_point);
        // 鼠标移动--实时绘制圆形
        this.handler.setInputAction((event) => {
          // 屏幕坐标转为世界坐标
          const ray = this.viewer.camera.getPickRay(event.endPosition);
          if (!ray) return;

          const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
          if (!cartesian) return;

          const ellipsoid = this.viewer.scene.globe.ellipsoid;
          const cartographic = ellipsoid.cartesianToCartographic(cartesian);
          const lon = Cesium.Math.toDegrees(cartographic.longitude); // 经度
          const lat = Cesium.Math.toDegrees(cartographic.latitude); // 纬度

          if (this.temporary_circle_entity) {
            // 修改结束点-用于动态绘制圆形
            this.circle_end_point = {
              lon: lon,
              lat: lat,
              height: 0,
            };
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  // 创建圆心点
  create_circle_center_point(point_arr) {
    this.circle_center_entity = this.viewer.entities.add({
      id: 'circle_center_' + Date.now(),
      // fromDegrees（经度，纬度，高度）以度为单位的经度和纬度值返回Cartesian3位置
      position: Cesium.Cartesian3.fromDegrees(point_arr[0], point_arr[1], 100),
      point: {
        // 点的大小（像素）
        pixelSize: 5,
        // 点位颜色，fromCssColorString 可以直接使用CSS颜色
        color: Cesium.Color.WHITE,
        // 边框颜色
        outlineColor: Cesium.Color.fromCssColorString('#fff'),
        // 边框宽度(像素)
        outlineWidth: 2,
        // 是否显示
        show: true,
      },
    });
  }

  // 绘制动态圆
  draw_dynamic_circle(point) {
    this.temporary_circle_entity = this.viewer.entities.add({
      id: 'draw_dynamic_circle_' + Date.now(),
      position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
      ellipse: {
        // 半短轴（画圆：半短轴和半长轴一致即可）
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          // PolygonHierarchy 定义多边形及其孔的线性环的层次结构（空间坐标数组）
          if (this.circle_end_point) {
            return this.two_points_distance(point, this.circle_end_point);
          }
        }, false),
        // 半长轴
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          // PolygonHierarchy 定义多边形及其孔的线性环的层次结构（空间坐标数组）
          if (this.circle_end_point) {
            return this.two_points_distance(point, this.circle_end_point);
          }
        }, false),
        // 填充色
        material: this.bgColor,
        // 是否有边框
        outline: false,
        // 边框颜色
        outlineColor: Cesium.Color.YELLOW,
        // 边框宽度
        outlineWidth: 20,
        // height: 0,
      },
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          if (!this.circle_end_point) return [];

          const radius = this.two_points_distance(point, this.circle_end_point);
          const positions: any = [];
          const segments = 3600; // 边框线段数，可以调整以改变平滑度

          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Cesium.Math.TWO_PI;
            const x =
              point.lon +
              (radius * Math.cos(angle)) / (111320 * Math.cos((point.lat * Math.PI) / 180));
            const y = point.lat + (radius * Math.sin(angle)) / 111320;
            positions.push(Cesium.Cartesian3.fromDegrees(x, y));
          }

          return positions;
        }, false),
        width: 2, // 边框宽度
        material: Cesium.Color.YELLOW,
        clampToGround: true,
      },
    });
  }

  // 绘制结果圆形
  draw_circle() {
    if (!this.circle_end_point) return [];
    const radius = this.two_points_distance(this.circle_center_point, this.circle_end_point);
    const positions: any = [];
    const segments = 3600; // 边框线段数，可以调整以改变平滑度
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Cesium.Math.TWO_PI;
      const x =
        this.circle_center_point.lon +
        (radius * Math.cos(angle)) /
          (111320 * Math.cos((this.circle_center_point.lat * Math.PI) / 180));
      const y = this.circle_center_point.lat + (radius * Math.sin(angle)) / 111320;
      positions.push(Cesium.Cartesian3.fromDegrees(x, y));
    }
    this.circle_entity = this.viewer.entities.add({
      id: 'draw_circle_' + Date.now(),
      position: Cesium.Cartesian3.fromDegrees(
        this.circle_center_point.lon,
        this.circle_center_point.lat,
      ),
      ellipse: {
        // 半短轴（画圆：半短轴和半长轴一致即可）
        semiMinorAxis: this.two_points_distance(this.circle_center_point, this.circle_end_point),
        // 半长轴
        semiMajorAxis: this.two_points_distance(this.circle_center_point, this.circle_end_point),
        // 填充色
        material: this.bgColor,
        // 是否有边框
        outline: true,
        // 边框颜色
        outlineColor: Cesium.Color.WHITE,
        // 边框宽度
        outlineWidth: 4,
      },
      polyline: {
        positions: positions,
        width: 2, // 边框宽度
        material: Cesium.Color.YELLOW,
        clampToGround: true,
      },
    });
  }

  // 根据经纬度计算两点之前的直线距离
  two_points_distance(start_point, end_point) {
    // 经纬度转换为世界坐标
    const start_position = Cesium.Cartesian3.fromDegrees(
      start_point.lon,
      start_point.lat,
      start_point.height,
    );
    const end_position = Cesium.Cartesian3.fromDegrees(
      end_point.lon,
      end_point.lat,
      end_point.height,
    );
    // 返回两个坐标的距离（单位：米）
    return Cesium.Cartesian3.distance(start_position, end_position);
  }

  // 清除实体
  clear() {
    if (this.circle_entity !== null) {
      if (this.circle_center_entity) {
        this.viewer.entities.remove(this.circle_center_entity);
      }
      if (this.temporary_circle_entity) {
        this.viewer.entities.remove(this.temporary_circle_entity);
      }
      this.viewer.entities.remove(this.circle_entity);
      this.circle_center_entity = null;
      this.temporary_circle_entity = null;
      this.circle_entity = null;
      this.circle_end_point = null;
      this.circle_center_point = null;
    }
    // 清除所有点击事件
    if (this.handler) {
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
  }
}
