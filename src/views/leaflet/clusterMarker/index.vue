<script setup lang="ts">
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import * as L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { Map as LeafletMap } from "leaflet";
import { onBeforeUnmount, shallowRef } from "vue";
import ReLeafletMap from "@/components/ReLeafletMap";
import { markerClusterGroup } from "@/utils/leaflet/markercluster";
import points from "./points.json";

defineOptions({
  name: "LeafletClusterMarker"
});

interface ClusterPoint {
  id: string;
  city: string;
  district: string;
  name: string;
  lng: number;
  lat: number;
}

const clusterLayer = shallowRef<L.MarkerClusterGroup | null>(null);

const pointIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function destroyClusterLayer() {
  clusterLayer.value?.clearLayers();
  clusterLayer.value?.remove();
  clusterLayer.value = null;
}

function handleReady(map: LeafletMap) {
  destroyClusterLayer();

  const layer = markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false
  });

  const markers = (points as ClusterPoint[]).map(point =>
    L.marker([point.lat, point.lng], {
      icon: pointIcon,
      title: point.name
    }).bindPopup(
      `<strong>${point.name}</strong><br />${point.city} ${point.district}`
    )
  );

  layer.addLayers(markers);
  layer.addTo(map);
  clusterLayer.value = layer;
  map.fitBounds(layer.getBounds(), { padding: [24, 24] });
}

onBeforeUnmount(() => {
  destroyClusterLayer();
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

:deep(.marker-cluster-small),
:deep(.marker-cluster-medium),
:deep(.marker-cluster-large) {
  background-color: #f2c230;
}

:deep(.marker-cluster-small div),
:deep(.marker-cluster-medium div),
:deep(.marker-cluster-large div) {
  background-color: #f7d24b;
  color: #1f2933;
  font-weight: 600;
}
</style>
