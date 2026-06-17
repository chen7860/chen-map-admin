<script setup lang="ts">
import * as L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { onBeforeUnmount, shallowRef } from "vue";
import ReLeafletMap from "@/components/ReLeafletMap";
import {
  addArrowPath,
  type ArrowPathManager
} from "@/utils/leaflet/arrowPolyline";

defineOptions({
  name: "LeafletMovingTrack"
});

const pointLayer = shallowRef<L.LayerGroup | null>(null);
const arrowPathManagers: ArrowPathManager[] = [];

const trackCoordinates: [number, number][] = [
  [116.38965, 39.90655],
  [116.393, 39.90656],
  [116.3967, 39.90655],
  [116.4003, 39.9065],
  [116.40116, 39.90395],
  [116.40105, 39.9002],
  [116.3998, 39.89975],
  [116.3964, 39.89973],
  [116.392, 39.8998],
  [116.38965, 39.9032]
];

function destroyTrack() {
  arrowPathManagers.splice(0).forEach(manager => manager.destroy());

  pointLayer.value?.clearLayers();
  pointLayer.value?.remove();
  pointLayer.value = null;
}

function createTrackPointsLayer(map: LeafletMap) {
  const layer = L.layerGroup();

  trackCoordinates.forEach((coordinate, index) => {
    const latLng = L.latLng(coordinate[1], coordinate[0]);
    L.circleMarker(latLng, {
      radius: index === 0 || index === trackCoordinates.length - 1 ? 7 : 5,
      color: "#ffffff",
      weight: 2,
      fillColor:
        index === 0
          ? "#52c41a"
          : index === trackCoordinates.length - 1
            ? "#ff4d4f"
            : "#1677ff",
      fillOpacity: 1
    })
      .bindPopup(`轨迹点 ${index + 1}`)
      .addTo(layer);
  });

  layer.addTo(map);
  pointLayer.value = layer;
}

function drawArrowPath(map: LeafletMap) {
  destroyTrack();

  for (let index = 0; index < trackCoordinates.length; index += 1) {
    const nextIndex = (index + 1) % trackCoordinates.length;

    arrowPathManagers.push(
      addArrowPath(
        map,
        [trackCoordinates[index], trackCoordinates[nextIndex]],
        {
          color: "#e74c3c",
          weight: 4,
          opacity: 1,
          arrow: {
            size: 15,
            color: "#c0392b",
            showAtEnd: true
          },
          animation: {
            enabled: true,
            speed: 6000
          }
        }
      )
    );
  }

  createTrackPointsLayer(map);
}

function handleReady(map: LeafletMap) {
  const trackPoints = trackCoordinates.map(coordinate =>
    L.latLng(coordinate[1], coordinate[0])
  );
  const bounds = L.latLngBounds(trackPoints);

  drawArrowPath(map);
  map.fitBounds(bounds, { padding: [36, 36] });
}

onBeforeUnmount(() => {
  destroyTrack();
});
</script>

<template>
  <div class="leaflet-page">
    <ReLeafletMap height="calc(100vh - 150px)" @ready="handleReady" />
  </div>
</template>

<style lang="scss" scoped>
.leaflet-page {
  display: flex;
  flex-direction: column;
}
</style>
