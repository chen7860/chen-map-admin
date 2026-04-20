import type { Viewer } from "cesium";

export interface CesiumMapSize {
  width?: string | number;
  height?: string | number;
}

export function normalizeSize(value?: string | number, fallback = "100%"): string {
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
  viewer.camera.flyHome(0);
}

export function safeDestroy<T extends { isDestroyed?: () => boolean; destroy?: () => void }>(
  target?: T | null
) {
  if (!target?.destroy) return;
  if (typeof target.isDestroyed === "function" && target.isDestroyed()) return;
  target.destroy();
}
