import { Ion } from "cesium";

Ion.defaultAccessToken = "";

export const defaultViewerOptions = {
  shouldAnimate: true,
  contextOptions: {
    webgl: {
      alpha: true,
      stencil: true,
      antialias: true,
      preserveDrawingBuffer: true
    }
  },
  animation: false,
  infoBox: false,
  fullscreenButton: false,
  selectionIndicator: false,
  navigationHelpButton: false,
  navigationInstructionsInitiallyVisible: false,
  homeButton: false,
  sceneModePicker: false,
  geocoder: false,
  baseLayerPicker: false,
  timeline: false
  // imageryProvider: false, // 禁用默认影像图层
  // terrainProvider: new Cesium.EllipsoidTerrainProvider({}) // 移除自带地形
};

export type CesiumViewerOptions = Partial<typeof defaultViewerOptions>;
