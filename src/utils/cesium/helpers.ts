import { Cartesian3, type Viewer } from "cesium";

export interface CesiumMapSize {
  width?: string | number;
  height?: string | number;
}

export function normalizeSize(
  value?: string | number,
  fallback = "100%"
): string {
  if (value === undefined || value === null || value === "") return fallback;
  return typeof value === "number" ? `${value}px` : value;
}

export function getMapStyle(size: CesiumMapSize) {
  return {
    width: normalizeSize(size.width),
    height: normalizeSize(size.height)
  };
}

export function setDefaultView(viewer: Viewer) {
  // 默认定位到广东佛山
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(113.122717, 23.028762, 500000), // [经度, 纬度, 高度/米]
    duration: 4 // 飞行动画时间（秒），0 表示瞬间到达
  });
}

export function safeDestroy<
  T extends { isDestroyed?: () => boolean; destroy?: () => void }
>(target?: T | null) {
  if (!target?.destroy) return;
  if (typeof target.isDestroyed === "function" && target.isDestroyed()) return;
  target.destroy();
}
