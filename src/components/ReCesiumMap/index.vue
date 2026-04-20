<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Viewer } from "cesium";
import { createViewer, destroyViewer } from "@/utils/cesium/viewer";
import { getMapStyle } from "@/utils/cesium/helpers";
import type { CesiumViewerOptions } from "@/utils/cesium/config";

defineOptions({
  name: "ReCesiumMap"
});

interface Props {
  width?: string | number;
  height?: string | number;
  viewerOptions?: CesiumViewerOptions;
}

const props = withDefaults(defineProps<Props>(), {
  width: "100%",
  height: "100%",
  viewerOptions: () => ({})
});

const emit = defineEmits<{
  (e: "ready", viewer: Viewer): void;
  (e: "error", error: unknown): void;
}>();

const containerRef = ref<HTMLDivElement>();
const viewerRef = ref<Viewer | null>(null);
const errorMessage = ref("");

const containerStyle = computed(() => getMapStyle(props));

function getViewer() {
  return viewerRef.value;
}

function destroy() {
  destroyViewer(viewerRef.value);
  viewerRef.value = null;
}

async function init() {
  if (!containerRef.value) return;
  errorMessage.value = "";
  try {
    viewerRef.value = createViewer(containerRef.value, props.viewerOptions);
    emit("ready", viewerRef.value);
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
  getViewer,
  destroy
});
</script>

<template>
  <div class="re-cesium-map" :style="containerStyle">
    <div ref="containerRef" class="re-cesium-map__container" />
    <div v-if="errorMessage" class="re-cesium-map__error">
      <el-empty :description="errorMessage" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.re-cesium-map {
  position: relative;
  width: 100%;
  min-height: 360px;
  overflow: hidden;
  border-radius: 8px;
  background: #0b1220;

  &__container,
  :deep(.cesium-viewer),
  :deep(.cesium-widget) {
    width: 100%;
    height: 100%;
  }

  &__error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(11 18 32 / 88%);
  }
}
</style>
