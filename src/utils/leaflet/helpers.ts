import type { Map as LeafletMap } from "leaflet";

export interface LeafletMapSize {
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

export function getMapStyle(size: LeafletMapSize) {
  return {
    width: normalizeSize(size.width),
    height: normalizeSize(size.height)
  };
}

export function destroyMap(map?: LeafletMap | null) {
  map?.remove();
}
