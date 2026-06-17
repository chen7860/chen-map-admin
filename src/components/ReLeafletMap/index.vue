<script setup lang="ts">
import "leaflet/dist/leaflet.css";

import {
  computed,
  markRaw,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef
} from "vue";
import {
  map as createLeafletMap,
  tileLayer,
  type LatLngExpression,
  type Map as LeafletMap,
  type MapOptions,
  type TileLayer,
  type TileLayerOptions
} from "leaflet";
import { destroyMap, getMapStyle } from "@/utils/leaflet/helpers";
import {
  defaultAnnotationLayerOptions,
  defaultAnnotationLayerUrl,
  defaultCenter,
  defaultMapOptions,
  defaultTileLayerOptions,
  defaultTileLayerUrl,
  defaultZoom
} from "@/utils/leaflet/config";

defineOptions({
  name: "ReLeafletMap"
});

interface Props {
  width?: string | number;
  height?: string | number;
  center?: LatLngExpression;
  zoom?: number;
  mapOptions?: MapOptions;
  tileLayerUrl?: string;
  tileLayerOptions?: TileLayerOptions;
  annotationLayerUrl?: string;
  annotationLayerOptions?: TileLayerOptions;
  enableDefaultTileLayer?: boolean;
  enableAnnotationLayer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: "100%",
  height: "100%",
  center: () => defaultCenter,
  zoom: defaultZoom,
  mapOptions: () => ({}),
  tileLayerUrl: defaultTileLayerUrl,
  tileLayerOptions: () => ({}),
  annotationLayerUrl: defaultAnnotationLayerUrl,
  annotationLayerOptions: () => ({}),
  enableDefaultTileLayer: true,
  enableAnnotationLayer: true
});

const emit = defineEmits<{
  (
    e: "ready",
    map: LeafletMap,
    layers: {
      defaultTileLayer: TileLayer | null;
      annotationLayer: TileLayer | null;
    }
  ): void;
  (e: "error", error: unknown): void;
}>();

const containerRef = ref<HTMLDivElement>();
const mapRef = shallowRef<LeafletMap | null>(null);
const errorMessage = ref("");

const containerStyle = computed(() => getMapStyle(props));

function getMap() {
  return mapRef.value;
}

function destroy() {
  destroyMap(mapRef.value);
  mapRef.value = null;
}

function init() {
  if (!containerRef.value) return;
  errorMessage.value = "";

  try {
    const map = createLeafletMap(containerRef.value, {
      ...defaultMapOptions,
      ...props.mapOptions
    }).setView(props.center, props.zoom);

    const defaultTileLayer = props.enableDefaultTileLayer
      ? tileLayer(props.tileLayerUrl, {
          ...defaultTileLayerOptions,
          ...props.tileLayerOptions
        }).addTo(map)
      : null;

    const annotationLayer = props.enableAnnotationLayer
      ? tileLayer(props.annotationLayerUrl, {
          ...defaultAnnotationLayerOptions,
          ...props.annotationLayerOptions
        }).addTo(map)
      : null;

    mapRef.value = markRaw(map);
    emit("ready", mapRef.value, {
      defaultTileLayer,
      annotationLayer
    });
  } catch (error) {
    destroy();
    errorMessage.value = "地图初始化失败，请稍后重试";
    emit("error", error);
  }
}

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  destroy();
});

defineExpose({
  getMap,
  destroy
});
</script>

<template>
  <div class="re-leaflet-map" :style="containerStyle">
    <div ref="containerRef" class="re-leaflet-map__container" />
    <div v-if="errorMessage" class="re-leaflet-map__error">
      <el-empty :description="errorMessage" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.re-leaflet-map {
  position: relative;
  width: 100%;
  min-height: 360px;
  overflow: hidden;
  border-radius: 8px;
  background: #eef2f5;

  &__container {
    z-index: 1;
    width: 100%;
    height: 100%;
  }

  &__error {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(238 242 245 / 88%);
  }
}
</style>
