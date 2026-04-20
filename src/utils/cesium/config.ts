import { Ion } from "cesium";

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMTdlM2QyYi0yMGE2LTQ3N2YtOTY5ZS03NTgxYjlmZDRhZGYiLCJpZCI6NDIwNDU5LCJpYXQiOjE3NzY2NTEzMzd9.dnsoJXyvGobaEKkj7ZOGMxYUU1d4yg3Ne4fJ2fNeAkU";

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
