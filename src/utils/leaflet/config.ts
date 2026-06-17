import type { LatLngExpression, MapOptions, TileLayerOptions } from "leaflet";

export const defaultCenter: LatLngExpression = [23.028762, 113.122717];

export const defaultZoom = 11;

export const tiandituKey = "468f245cef15e7af8c5a6c3d59908f89";

export const tiandituSubdomains = ["0", "1", "2", "3", "4", "5", "6", "7"];

export const defaultMapOptions: MapOptions = {
  zoomControl: true,
  attributionControl: true
};

export const defaultTileLayerUrl = `https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=${tiandituKey}`;

export const defaultAnnotationLayerUrl = `https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=${tiandituKey}`;

export const defaultTileLayerOptions: TileLayerOptions = {
  maxZoom: 18,
  subdomains: tiandituSubdomains,
  attribution: "天地图"
};

export const defaultAnnotationLayerOptions: TileLayerOptions = {
  maxZoom: 18,
  subdomains: tiandituSubdomains
};
