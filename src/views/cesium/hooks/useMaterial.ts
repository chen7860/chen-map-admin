import * as Cesium from "cesium";
import {
  type Color,
  Event,
  type JulianDate,
  type MaterialProperty,
  type Property,
  type Viewer,
  type Entity,
  type Cartesian3,
  CallbackProperty
} from "cesium";

import LineOfMotion from "@/utils/cesium/lineOfMotion";

import { message } from "@/utils/message";

const materialType = "PureAdminPulseMaterial";

class PulseMaterialProperty implements MaterialProperty {
  readonly isConstant = false;
  readonly definitionChanged = new Event();
  color: Color;
  speed: number;

  constructor(color: Color, speed: number) {
    this.color = color;
    this.speed = speed;
  }

  getType(_time: JulianDate) {
    return materialType;
  }

  getValue(_time: JulianDate, result?: Record<string, unknown>) {
    const materialResult = result ?? {};
    materialResult.color = this.color;
    materialResult.speed = this.speed;
    return materialResult;
  }

  equals(other?: Property) {
    return (
      other instanceof PulseMaterialProperty &&
      other.color.equals(this.color) &&
      other.speed === this.speed
    );
  }
}

export function useMaterial() {
  const entities: Entity[] = [];
  const pathPoints: Array<[number, number]> = []; // 存储 [lng, lat]
  let isDrawing = false;
  let viewer: Viewer | null = null;
  let lineOfMotion: LineOfMotion | null = null;
  let tempPolylineEntity: Entity | null = null;
  const activeShapePoints: Cartesian3[] = [];
  let handler: any = null;

  // 启用绘制模式
  function startDrawing(v: Viewer) {
    if (isDrawing) return;
    viewer = v;
    lineOfMotion = new LineOfMotion(viewer);
    isDrawing = true;
    pathPoints.length = 0;
    activeShapePoints.length = 0;

    // 清理之前的绘制残留
    if (tempPolylineEntity) {
      viewer.entities.remove(tempPolylineEntity);
      tempPolylineEntity = null;
    }
    entities.forEach(entity => viewer!.entities.remove(entity));
    entities.length = 0;

    handleMapClick();

    message("绘制模式已启用，左键点击地图添加点，右键结束绘制", {
      type: "info"
    });
    console.log("绘制模式已启用，左键点击地图添加点，右键结束绘制");
  }

  // 处理地图交互事件
  function handleMapClick() {
    if (!viewer) return;

    handler = new (Cesium as any).ScreenSpaceEventHandler(viewer.canvas);

    // 左键点击添加点
    handler.setInputAction(
      (click: any) => {
        if (!viewer || !isDrawing) return;

        const earthPosition = viewer.camera.pickEllipsoid(
          click.position,
          viewer.scene.globe.ellipsoid
        );

        if (typeof earthPosition !== "undefined") {
          const cartographic = (Cesium as any).Cartographic.fromCartesian(
            earthPosition
          );
          const lng = (Cesium as any).Math.toDegrees(cartographic.longitude);
          const lat = (Cesium as any).Math.toDegrees(cartographic.latitude);

          pathPoints.push([lng, lat]);

          if (activeShapePoints.length === 0) {
            activeShapePoints.push(earthPosition);
            activeShapePoints.push(earthPosition.clone()); // 复制一个用于跟随鼠标

            // 创建动态线
            tempPolylineEntity = viewer.entities.add({
              polyline: {
                positions: new CallbackProperty(() => {
                  return activeShapePoints;
                }, false),
                width: 3,
                color: (Cesium as any).Color.RED.withAlpha(0.8),
                material: new (Cesium as any).PolylineDashMaterialProperty({
                  color: (Cesium as any).Color.RED
                })
              }
            });
          } else {
            activeShapePoints[activeShapePoints.length - 1] = earthPosition;
            activeShapePoints.push(earthPosition.clone());
          }

          // 添加点标记
          const pointEntity = viewer.entities.add({
            position: earthPosition,
            point: {
              pixelSize: 8,
              color: (Cesium as any).Color.YELLOW,
              outlineColor: (Cesium as any).Color.BLACK,
              outlineWidth: 1
            }
          });
          entities.push(pointEntity);

          console.log(
            `已添加路点 ${pathPoints.length}: [${lng.toFixed(4)}, ${lat.toFixed(4)}]`
          );
        }
      },
      (Cesium as any).ScreenSpaceEventType.LEFT_CLICK
    );

    // 鼠标移动更新动态线
    handler.setInputAction(
      (movement: any) => {
        if (!viewer || !isDrawing || activeShapePoints.length === 0) return;

        const newPosition = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid
        );

        if (newPosition) {
          activeShapePoints[activeShapePoints.length - 1] = newPosition;
        }
      },
      (Cesium as any).ScreenSpaceEventType.MOUSE_MOVE
    );

    // 右键结束绘制
    handler.setInputAction(
      () => {
        finishDrawing();
      },
      (Cesium as any).ScreenSpaceEventType.RIGHT_CLICK
    );
  }

  // 完成绘制
  function finishDrawing() {
    if (!isDrawing) return;

    if (pathPoints.length < 2) {
      console.warn("至少需要 2 个路点才能生成线路");
      message("至少需要 2 个路点才能生成线路", { type: "warning" });
      cancelDrawing();
      return;
    }

    isDrawing = false;
    if (handler) {
      handler.destroy();
      handler = null;
    }

    // 移除临时线和点
    if (tempPolylineEntity && viewer) {
      viewer.entities.remove(tempPolylineEntity);
      tempPolylineEntity = null;
    }
    entities.forEach(entity => {
      if (viewer) viewer.entities.remove(entity);
    });
    entities.length = 0;

    // 创建流动路径
    if (lineOfMotion) {
      lineOfMotion.createFlowingPath(pathPoints.flat());
    }

    console.log("流动路径已创建。点击重新初始化可以再次绘制。");
    message("已完成绘制。点击清除轨迹按钮可以重新开始", { type: "success" });
  }

  // 清除轨迹
  function clearPath() {
    if (viewer) {
      // 无论有无在绘制，都取消并清除所有相关实体
      cancelDrawing();

      // 清理创建的动画Entity
      if (lineOfMotion) {
        lineOfMotion.destroy();
      }
      // 需要重新建立一个新的 lineOfMotion 控制器实例，因为老的对象内的实体可能已被移出
      lineOfMotion = new LineOfMotion(viewer);

      message("轨迹已清除", { type: "success" });
    }
  }

  // 取消绘制
  function cancelDrawing() {
    isDrawing = false;
    pathPoints.length = 0;
    activeShapePoints.length = 0;

    if (handler) {
      handler.destroy();
      handler = null;
    }

    if (tempPolylineEntity && viewer) {
      viewer.entities.remove(tempPolylineEntity);
      tempPolylineEntity = null;
    }

    entities.forEach(entity => {
      if (viewer) viewer.entities.remove(entity);
    });
    entities.length = 0;

    console.log("绘制已取消");
  }

  async function init(v: Viewer) {
    viewer = v;
    // 不再自动启用交互式绘制，由按钮触发
  }

  function destroy(v?: Viewer | null) {
    cancelDrawing();
    if (lineOfMotion) {
      lineOfMotion.destroy();
      lineOfMotion = null;
    }
  }

  return {
    init,
    destroy,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    clearPath
  };
}
