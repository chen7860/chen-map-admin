<script setup lang="ts">
import * as L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { onBeforeUnmount, shallowRef } from "vue";
import ReLeafletMap from "@/components/ReLeafletMap";
import points from "../clusterMarker/points.json";

defineOptions({
  name: "LeafletCanvasMarker"
});

interface CanvasPoint {
  id: string;
  city: string;
  district: string;
  name: string;
  lng: number;
  lat: number;
}

const canvasLayer = shallowRef<L.LayerGroup | null>(null);

function destroyCanvasLayer() {
  canvasLayer.value?.clearLayers();
  canvasLayer.value?.remove();
  canvasLayer.value = null;
}

function getPointColor(city: string) {
  return city === "广州" ? "#1677ff" : "#13c2c2";
}

function handleReady(map: LeafletMap) {
  destroyCanvasLayer();

  const renderer = L.canvas({ padding: 0.5 });
  const layer = L.layerGroup();
  const bounds = L.latLngBounds([]);

  (points as CanvasPoint[]).forEach(point => {
    const latLng = L.latLng(point.lat, point.lng);
    const color = getPointColor(point.city);

    L.circleMarker(latLng, {
      renderer,
      radius: 5,
      stroke: true,
      color: "#ffffff",
      weight: 2,
      fill: true,
      fillColor: color,
      fillOpacity: 1
    })
      .bindPopup(
        `<strong>${point.name}</strong><br />${point.city} ${point.district}`
      )
      .addTo(layer);

    bounds.extend(latLng);
  });

  layer.addTo(map);
  canvasLayer.value = layer;
  map.fitBounds(bounds, { padding: [24, 24] });
}

onBeforeUnmount(() => {
  destroyCanvasLayer();
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
