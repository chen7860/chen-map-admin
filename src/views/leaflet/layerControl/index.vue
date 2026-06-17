<script setup lang="ts">
import * as L from "leaflet";
import type { Layer, Map as LeafletMap, Path, TileLayer } from "leaflet";
import { onBeforeUnmount, reactive, shallowRef } from "vue";
import ReLeafletMap from "@/components/ReLeafletMap";

defineOptions({
  name: "LeafletLayerControl"
});

type BusinessLayerKey = "device" | "area" | "track" | "hotspot";

interface LayerState {
  label: string;
  visible: boolean;
  opacity: number;
}

interface DevicePoint {
  name: string;
  status: "online" | "warning" | "offline";
  coordinate: [number, number];
}

interface AreaPolygon {
  name: string;
  color: string;
  coordinates: [number, number][];
}

interface Hotspot {
  name: string;
  coordinate: [number, number];
  radius: number;
  color: string;
}

interface LegendItem {
  label: string;
  color: string;
  type: "point" | "line" | "area";
}

const mapRef = shallowRef<LeafletMap | null>(null);
const annotationLayerRef = shallowRef<TileLayer | null>(null);
const annotationVisible = shallowRef(true);

const businessLayers = reactive<Record<BusinessLayerKey, LayerState>>({
  device: {
    label: "设备点位",
    visible: true,
    opacity: 100
  },
  area: {
    label: "区域面",
    visible: true,
    opacity: 42
  },
  track: {
    label: "巡检轨迹",
    visible: true,
    opacity: 88
  },
  hotspot: {
    label: "热点覆盖",
    visible: true,
    opacity: 36
  }
});

const layerStore: Record<BusinessLayerKey, L.LayerGroup | null> = {
  device: null,
  area: null,
  track: null,
  hotspot: null
};

const layerEntries = Object.entries(businessLayers) as [
  BusinessLayerKey,
  LayerState
][];

const devicePoints: DevicePoint[] = [
  { name: "西南巡检点", status: "online", coordinate: [116.39005, 39.90005] },
  { name: "西北监控点", status: "warning", coordinate: [116.39008, 39.90615] },
  { name: "东北岗亭", status: "online", coordinate: [116.4007, 39.9061] },
  {
    name: "东南摄像头",
    status: "offline",
    coordinate: [116.401, 39.90025]
  },
  { name: "中心巡检点", status: "online", coordinate: [116.39525, 39.90315] }
];

const areas: AreaPolygon[] = [
  {
    name: "西侧管理区",
    color: "#1677ff",
    coordinates: [
      [116.39045, 39.90545],
      [116.39435, 39.90545],
      [116.39425, 39.90145],
      [116.39055, 39.90145]
    ]
  },
  {
    name: "东侧保障区",
    color: "#13c2c2",
    coordinates: [
      [116.3971, 39.90535],
      [116.40075, 39.90525],
      [116.40062, 39.9012],
      [116.3972, 39.90128]
    ]
  }
];

const trackCoordinates: [number, number][] = [
  [116.38985, 39.90645],
  [116.3927, 39.90652],
  [116.39575, 39.90645],
  [116.39935, 39.90635],
  [116.40115, 39.9041],
  [116.40108, 39.9012],
  [116.39925, 39.89995],
  [116.3959, 39.89988],
  [116.39255, 39.89995],
  [116.3899, 39.90155],
  [116.38985, 39.90645]
];

const hotspots: Hotspot[] = [
  {
    name: "北侧人流热点",
    coordinate: [116.39555, 39.90545],
    radius: 125,
    color: "#ff4d4f"
  },
  {
    name: "南侧交通热点",
    coordinate: [116.3963, 39.90065],
    radius: 115,
    color: "#faad14"
  }
];

const legendItems: LegendItem[] = [
  { label: "在线设备", color: "#52c41a", type: "point" },
  { label: "告警设备", color: "#faad14", type: "point" },
  { label: "离线设备", color: "#8c8c8c", type: "point" },
  { label: "区域范围", color: "#1677ff", type: "area" },
  { label: "巡检轨迹", color: "#e74c3c", type: "line" },
  { label: "热点覆盖", color: "#ff4d4f", type: "area" }
];

function getStatusColor(status: DevicePoint["status"]) {
  const colorMap = {
    online: "#52c41a",
    warning: "#faad14",
    offline: "#8c8c8c"
  };

  return colorMap[status];
}

function toLatLng(coordinate: [number, number]) {
  return L.latLng(coordinate[1], coordinate[0]);
}

function createDeviceLayer() {
  const layer = L.layerGroup();

  devicePoints.forEach(point => {
    L.circleMarker(toLatLng(point.coordinate), {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: getStatusColor(point.status),
      fillOpacity: 1
    })
      .bindPopup(`<strong>${point.name}</strong><br />状态：${point.status}`)
      .addTo(layer);
  });

  return layer;
}

function createAreaLayer() {
  const layer = L.layerGroup();

  areas.forEach(area => {
    L.polygon(area.coordinates.map(toLatLng), {
      color: area.color,
      weight: 2,
      fillColor: area.color,
      fillOpacity: businessLayers.area.opacity / 100
    })
      .bindPopup(area.name)
      .addTo(layer);
  });

  return layer;
}

function createTrackLayer() {
  const layer = L.layerGroup();
  const latLngs = trackCoordinates.map(toLatLng);

  L.polyline(latLngs, {
    color: "#e74c3c",
    weight: 5,
    opacity: businessLayers.track.opacity / 100,
    lineCap: "round",
    lineJoin: "round"
  })
    .bindPopup("巡检轨迹")
    .addTo(layer);

  latLngs.forEach((latLng, index) => {
    if (index === latLngs.length - 1) return;

    L.circleMarker(latLng, {
      radius: index === 0 ? 7 : 4,
      color: "#ffffff",
      weight: 2,
      fillColor: index === 0 ? "#52c41a" : "#e74c3c",
      fillOpacity: 1
    }).addTo(layer);
  });

  return layer;
}

function createHotspotLayer() {
  const layer = L.layerGroup();

  hotspots.forEach(hotspot => {
    L.circle(toLatLng(hotspot.coordinate), {
      radius: hotspot.radius,
      color: hotspot.color,
      weight: 2,
      fillColor: hotspot.color,
      fillOpacity: businessLayers.hotspot.opacity / 100
    })
      .bindPopup(hotspot.name)
      .addTo(layer);
  });

  return layer;
}

function setLayerOpacity(layer: L.LayerGroup | null, opacity: number) {
  if (!layer) return;

  layer.eachLayer((item: Layer) => {
    const path = item as Path;

    if (typeof path.setStyle !== "function") return;

    path.setStyle({
      opacity: opacity / 100,
      fillOpacity: opacity / 100
    });
  });
}

function syncBusinessLayer(key: BusinessLayerKey) {
  const map = mapRef.value;
  const layerState = businessLayers[key];
  const layer = layerStore[key];

  if (!map || !layer) return;

  if (layerState.visible) {
    layer.addTo(map);
  } else {
    layer.remove();
  }

  setLayerOpacity(layer, layerState.opacity);
}

function handleLayerVisibleChange(key: BusinessLayerKey, visible: boolean) {
  businessLayers[key].visible = visible;
  syncBusinessLayer(key);
}

function handleOpacityChange(key: BusinessLayerKey) {
  setLayerOpacity(layerStore[key], businessLayers[key].opacity);
}

function setAllVisible(visible: boolean) {
  layerEntries.forEach(([key, layerState]) => {
    layerState.visible = visible;
    syncBusinessLayer(key);
  });
}

function clearBusinessLayers() {
  layerEntries.forEach(([key]) => {
    layerStore[key]?.remove();
    layerStore[key]?.clearLayers();
    layerStore[key] = null;
  });
}

function toggleAnnotationLayer() {
  const map = mapRef.value;
  const annotationLayer = annotationLayerRef.value;

  if (!map || !annotationLayer) return;

  if (annotationVisible.value) {
    annotationLayer.addTo(map);
  } else {
    annotationLayer.remove();
  }
}

function handleReady(
  map: LeafletMap,
  layers: {
    defaultTileLayer: TileLayer | null;
    annotationLayer: TileLayer | null;
  }
) {
  clearBusinessLayers();
  mapRef.value = map;
  annotationLayerRef.value = layers.annotationLayer;
  layerStore.device = createDeviceLayer();
  layerStore.area = createAreaLayer();
  layerStore.track = createTrackLayer();
  layerStore.hotspot = createHotspotLayer();

  layerEntries.forEach(([key]) => syncBusinessLayer(key));
  map.setView([39.90325, 116.3955], 16);
}

onBeforeUnmount(() => {
  clearBusinessLayers();
});
</script>

<template>
  <div class="leaflet-layer-page">
    <ReLeafletMap height="calc(100vh - 150px)" @ready="handleReady" />

    <section class="layer-panel">
      <header class="layer-panel__header">
        <strong>图层控制</strong>
        <div class="layer-panel__actions">
          <el-button
            size="small"
            text
            type="primary"
            @click="setAllVisible(true)"
          >
            全选
          </el-button>
          <el-button
            size="small"
            text
            type="danger"
            @click="setAllVisible(false)"
          >
            清空
          </el-button>
        </div>
      </header>

      <div class="layer-panel__base">
        <span>地图标注</span>
        <el-switch
          v-model="annotationVisible"
          @change="toggleAnnotationLayer"
        />
      </div>

      <div
        v-for="[key, layerState] in layerEntries"
        :key="key"
        class="layer-item"
      >
        <div class="layer-item__top">
          <span>{{ layerState.label }}</span>
          <el-switch
            v-model="layerState.visible"
            @change="visible => handleLayerVisibleChange(key, Boolean(visible))"
          />
        </div>
        <el-slider
          v-model="layerState.opacity"
          :disabled="!layerState.visible"
          :min="10"
          :max="100"
          :step="2"
          @input="handleOpacityChange(key)"
        />
      </div>

      <div class="layer-legend">
        <strong>图例</strong>
        <div class="layer-legend__grid">
          <div
            v-for="item in legendItems"
            :key="item.label"
            class="legend-item"
          >
            <i
              :class="`legend-item__symbol legend-item__symbol--${item.type}`"
              :style="{ '--legend-color': item.color }"
            />
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.leaflet-layer-page {
  position: relative;
}

.layer-panel {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 500;
  width: 280px;
  padding: 14px;
  color: #1f2933;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(15 23 42 / 10%);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 16%);
  backdrop-filter: blur(8px);

  &__header,
  &__base,
  .layer-item__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__header {
    margin-bottom: 12px;
  }

  &__actions {
    display: flex;
    gap: 4px;
  }

  &__base {
    padding: 10px 0;
    font-size: 13px;
    border-top: 1px solid rgb(15 23 42 / 8%);
    border-bottom: 1px solid rgb(15 23 42 / 8%);
  }
}

.layer-item {
  padding-top: 12px;

  &__top {
    margin-bottom: 2px;
    font-size: 13px;
  }

  :deep(.el-slider) {
    --el-slider-main-bg-color: #1677ff;

    height: 28px;
  }
}

.layer-legend {
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid rgb(15 23 42 / 8%);

  strong {
    display: block;
    margin-bottom: 10px;
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px 12px;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  font-size: 12px;
  color: #475569;

  &__symbol {
    flex: 0 0 auto;
    background: var(--legend-color);

    &--point {
      width: 10px;
      height: 10px;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgb(15 23 42 / 14%);
    }

    &--line {
      width: 18px;
      height: 4px;
      border-radius: 999px;
    }

    &--area {
      width: 14px;
      height: 10px;
      border: 1px solid var(--legend-color);
      background: color-mix(in srgb, var(--legend-color) 42%, transparent);
      border-radius: 2px;
    }
  }
}
</style>
