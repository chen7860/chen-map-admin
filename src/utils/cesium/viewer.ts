import {
  Viewer,
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme
} from "cesium";
import { defaultViewerOptions, type CesiumViewerOptions } from "./config";
import { safeDestroy, setDefaultView } from "./helpers";

export function createViewer(
  container: string | Element,
  options: CesiumViewerOptions = {}
) {
  const viewer = new Viewer(container, {
    ...defaultViewerOptions,
    ...options
  });

  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.debugShowFramesPerSecond = false;
  (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";

  // 加载天地图
  const tdtKey = "468f245cef15e7af8c5a6c3d59908f89"; // Replace with your Tianditu API key
  const subdomains = ["0", "1", "2", "3", "4", "5", "6", "7"];

  // 影像底图
  const tiandituImageryProvider = new UrlTemplateImageryProvider({
    url: `https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=${tdtKey}`,
    subdomains: subdomains,
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18
  });

  // 注记
  const tiandituTextProvider = new UrlTemplateImageryProvider({
    url: `https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=${tdtKey}`,
    subdomains: subdomains,
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18
  });

  viewer.imageryLayers.addImageryProvider(tiandituImageryProvider);
  viewer.imageryLayers.addImageryProvider(tiandituTextProvider);

  setDefaultView(viewer);

  return viewer;
}

export function destroyViewer(viewer?: Viewer | null) {
  if (!viewer) return;

  // Route switches can trigger multiple unmount hooks; skip when already destroyed.
  if (typeof viewer.isDestroyed === "function" && viewer.isDestroyed()) return;

  try {
    viewer.entities.removeAll();
    viewer.dataSources.removeAll(true);
    viewer.imageryLayers.removeAll(true);
  } catch {
    // Ignore cleanup errors if Cesium internals are already released.
  }

  safeDestroy(viewer.screenSpaceEventHandler);
  safeDestroy(viewer);
}
