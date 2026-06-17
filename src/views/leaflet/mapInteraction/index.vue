<script setup lang="ts">
import * as L from "leaflet";
import type { LatLng, Map as LeafletMap, Rectangle } from "leaflet";
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { message } from "@/utils/message";
import ReLeafletMap from "@/components/ReLeafletMap";

defineOptions({
  name: "LeafletMapInteraction"
});

interface DemoPoint {
  id: string;
  name: string;
  coordinate: [number, number];
  type: "camera" | "gate" | "patrol";
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  latlng: LatLng | null;
}

const mapRef = shallowRef<LeafletMap | null>(null);
const pointLayer = shallowRef<L.LayerGroup | null>(null);
const pickedLayer = shallowRef<L.LayerGroup | null>(null);
const selectionRectangle = shallowRef<Rectangle | null>(null);
const mouseLatLngText = ref("--");
const selectedIds = ref<string[]>([]);
const isBoxSelecting = ref(false);
const suppressNextClick = ref(false);
const boxStartLatLng = shallowRef<LatLng | null>(null);
const contextMenu = ref<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  latlng: null
});

const qiandengLakeCenter: [number, number] = [23.057504, 113.150014];

const demoPoints: DemoPoint[] = [
  {
    id: "p1",
    name: "湖岸西北监控点",
    coordinate: [113.14692, 23.05928],
    type: "camera"
  },
  {
    id: "p2",
    name: "商办东北岗亭",
    coordinate: [113.15325, 23.05785],
    type: "gate"
  },
  {
    id: "p3",
    name: "湖岸西南巡检点",
    coordinate: [113.14505, 23.0571],
    type: "patrol"
  },
  {
    id: "p4",
    name: "商办东南摄像头",
    coordinate: [113.15335, 23.05538],
    type: "camera"
  },
  {
    id: "p5",
    name: "千灯湖站巡查点",
    coordinate: [113.150014, 23.057504],
    type: "patrol"
  },
  {
    id: "p6",
    name: "公园北侧闸口",
    coordinate: [113.1492, 23.05968],
    type: "gate"
  },
  {
    id: "p7",
    name: "湖岸南侧闸口",
    coordinate: [113.14882, 23.0552],
    type: "gate"
  },
  {
    id: "p8",
    name: "地铁东侧监控点",
    coordinate: [113.15035, 23.05795],
    type: "camera"
  }
];

const selectedCountText = computed(
  () => `${selectedIds.value.length} / ${demoPoints.length}`
);

function toLatLng(coordinate: [number, number]) {
  return L.latLng(coordinate[1], coordinate[0]);
}

function formatLatLng(latlng: LatLng) {
  return `${latlng.lng.toFixed(6)}, ${latlng.lat.toFixed(6)}`;
}

function getPointColor(point: DemoPoint) {
  if (selectedIds.value.includes(point.id)) return "#ff4d4f";

  const colorMap = {
    camera: "#1677ff",
    gate: "#13c2c2",
    patrol: "#52c41a"
  };

  return colorMap[point.type];
}

function renderPoints() {
  const map = mapRef.value;
  if (!map) return;

  pointLayer.value?.remove();
  const layer = L.layerGroup();

  demoPoints.forEach(point => {
    L.circleMarker(toLatLng(point.coordinate), {
      radius: selectedIds.value.includes(point.id) ? 9 : 7,
      color: "#ffffff",
      weight: 2,
      fillColor: getPointColor(point),
      fillOpacity: 1
    })
      .bindPopup(
        `<strong>${point.name}</strong><br />${point.coordinate.join(", ")}`
      )
      .addTo(layer);
  });

  layer.addTo(map);
  pointLayer.value = layer;
}

function addPickedMarker(latlng: LatLng, label = "拾取坐标") {
  const map = mapRef.value;
  if (!map) return;

  if (!pickedLayer.value) {
    pickedLayer.value = L.layerGroup().addTo(map);
  }

  L.circleMarker(latlng, {
    radius: 8,
    color: "#ffffff",
    weight: 2,
    fillColor: "#722ed1",
    fillOpacity: 1
  })
    .bindPopup(`<strong>${label}</strong><br />${formatLatLng(latlng)}`)
    .addTo(pickedLayer.value)
    .openPopup();
}

function hideContextMenu() {
  contextMenu.value.visible = false;
}

function copyCoordinate(latlng = contextMenu.value.latlng) {
  if (!latlng) return;

  const text = formatLatLng(latlng);
  navigator.clipboard
    ?.writeText(text)
    .then(() => message("坐标已复制", { type: "success" }))
    .catch(() => message(text, { type: "info" }));
  hideContextMenu();
}

function addMarkerFromMenu() {
  if (!contextMenu.value.latlng) return;

  addPickedMarker(contextMenu.value.latlng, "右键标记");
  hideContextMenu();
}

function flyToMenuPosition() {
  const map = mapRef.value;
  const latlng = contextMenu.value.latlng;

  if (!map || !latlng) return;

  map.flyTo(latlng, 17, { duration: 0.6 });
  hideContextMenu();
}

function clearPickedMarkers() {
  pickedLayer.value?.clearLayers();
  hideContextMenu();
}

function resetView() {
  mapRef.value?.setView(qiandengLakeCenter, 16);
}

function clearSelection() {
  selectedIds.value = [];
  selectionRectangle.value?.remove();
  selectionRectangle.value = null;
  renderPoints();
}

function finishBoxSelecting() {
  isBoxSelecting.value = false;
  boxStartLatLng.value = null;
  mapRef.value?.dragging.enable();
  mapRef.value?.getContainer().classList.remove("is-box-selecting");
}

function cancelBoxSelect() {
  finishBoxSelecting();
  selectionRectangle.value?.remove();
  selectionRectangle.value = null;
}

function startBoxSelect() {
  if (isBoxSelecting.value) {
    cancelBoxSelect();
    return;
  }

  hideContextMenu();
  clearSelection();
  isBoxSelecting.value = true;
  mapRef.value?.dragging.disable();
  mapRef.value?.getContainer().classList.add("is-box-selecting");
}

function selectPointsInBounds(bounds: L.LatLngBounds) {
  selectedIds.value = demoPoints
    .filter(point => bounds.contains(toLatLng(point.coordinate)))
    .map(point => point.id);

  renderPoints();
  message(`已选中 ${selectedIds.value.length} 个点位`, { type: "success" });
}

function handleMouseMove(event: L.LeafletMouseEvent) {
  mouseLatLngText.value = formatLatLng(event.latlng);

  if (!isBoxSelecting.value || !boxStartLatLng.value) return;

  const bounds = L.latLngBounds(boxStartLatLng.value, event.latlng);

  if (!selectionRectangle.value) {
    selectionRectangle.value = L.rectangle(bounds, {
      color: "#1677ff",
      weight: 2,
      dashArray: "6 6",
      fillColor: "#1677ff",
      fillOpacity: 0.12
    }).addTo(mapRef.value!);
  } else {
    selectionRectangle.value.setBounds(bounds);
  }
}

function handleMouseDown(event: L.LeafletMouseEvent) {
  if (!isBoxSelecting.value) return;

  const originalEvent = event.originalEvent as MouseEvent;
  if (originalEvent.button !== 0) return;

  boxStartLatLng.value = event.latlng;
}

function handleMouseUp(event: L.LeafletMouseEvent) {
  if (!isBoxSelecting.value || !boxStartLatLng.value) return;

  const bounds = L.latLngBounds(boxStartLatLng.value, event.latlng);

  if (bounds.isValid()) {
    selectPointsInBounds(bounds);
  }

  suppressNextClick.value = true;
  finishBoxSelecting();
}

function handleMapClick(event: L.LeafletMouseEvent) {
  if (suppressNextClick.value) {
    suppressNextClick.value = false;
    return;
  }

  if (isBoxSelecting.value) return;

  hideContextMenu();
  addPickedMarker(event.latlng);
}

function handleContextMenu(event: L.LeafletMouseEvent) {
  const containerPoint = mapRef.value?.latLngToContainerPoint(event.latlng);
  if (!containerPoint) return;

  contextMenu.value = {
    visible: true,
    x: containerPoint.x,
    y: containerPoint.y,
    latlng: event.latlng
  };
}

function bindMapEvents(map: LeafletMap) {
  map.on("mousemove", handleMouseMove);
  map.on("mousedown", handleMouseDown);
  map.on("mouseup", handleMouseUp);
  map.on("click", handleMapClick);
  map.on("contextmenu", handleContextMenu);
}

function unbindMapEvents() {
  const map = mapRef.value;
  if (!map) return;

  map.off("mousemove", handleMouseMove);
  map.off("mousedown", handleMouseDown);
  map.off("mouseup", handleMouseUp);
  map.off("click", handleMapClick);
  map.off("contextmenu", handleContextMenu);
}

function handleReady(map: LeafletMap) {
  mapRef.value = map;
  map.setView(qiandengLakeCenter, 16);
  bindMapEvents(map);
  renderPoints();
}

onBeforeUnmount(() => {
  unbindMapEvents();
  pointLayer.value?.remove();
  pickedLayer.value?.remove();
  selectionRectangle.value?.remove();
});
</script>

<template>
  <div class="map-interaction-page">
    <ReLeafletMap height="calc(100vh - 150px)" @ready="handleReady" />

    <section class="interaction-panel">
      <header>
        <strong>地图交互增强</strong>
        <span>{{ selectedCountText }}</span>
      </header>

      <dl>
        <dt>鼠标坐标</dt>
        <dd>{{ mouseLatLngText }}</dd>
        <dt>框选状态</dt>
        <dd>{{ isBoxSelecting ? "拖拽地图选择点位" : "未开启" }}</dd>
      </dl>

      <div class="interaction-panel__actions">
        <el-button size="small" type="primary" @click="startBoxSelect">
          {{ isBoxSelecting ? "取消框选" : "框选点位" }}
        </el-button>
        <el-button size="small" @click="clearSelection">清空选择</el-button>
        <el-button size="small" @click="resetView">重置视图</el-button>
        <el-button size="small" type="danger" plain @click="clearPickedMarkers">
          清空标记
        </el-button>
      </div>
    </section>

    <div
      v-if="contextMenu.visible"
      class="map-context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
    >
      <button type="button" @click="addMarkerFromMenu">添加标记</button>
      <button type="button" @click="copyCoordinate()">复制坐标</button>
      <button type="button" @click="flyToMenuPosition">飞到此处</button>
      <button type="button" @click="clearPickedMarkers">清空标记</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-interaction-page {
  position: relative;
}

.interaction-panel {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 500;
  width: 286px;
  padding: 14px;
  color: #1f2933;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(15 23 42 / 10%);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 16%);
  backdrop-filter: blur(8px);

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid rgb(15 23 42 / 8%);

    span {
      font-size: 12px;
      color: #64748b;
    }
  }

  dl {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 8px 10px;
    margin: 12px 0;
    font-size: 13px;
  }

  dt {
    color: #64748b;
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: #0f172a;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}

.map-context-menu {
  position: absolute;
  z-index: 600;
  min-width: 132px;
  padding: 6px;
  background: rgb(255 255 255 / 96%);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 8px;
  box-shadow: 0 12px 28px rgb(15 23 42 / 20%);
  transform: translate(8px, 8px);

  button {
    display: block;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    color: #1f2933;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;

    &:hover {
      color: #1677ff;
      background: rgb(22 119 255 / 9%);
    }
  }
}

:deep(.is-box-selecting) {
  cursor: crosshair;
}
</style>
