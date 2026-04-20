<script setup lang="ts">
import type { Viewer } from "cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { useCesiumViewer } from "../hooks/useCesiumViewer";
import { useMaterial } from "../hooks/useMaterial";

defineOptions({
  name: "CesiumMaterial"
});

const { viewer, setViewer } = useCesiumViewer();
const materialDemo = useMaterial();

async function handleReady(instance: Viewer) {
  materialDemo.destroy(viewer.value);
  setViewer(instance);
  await materialDemo.init(instance);
}

function handleError(error: unknown) {
  console.error("Cesium material init failed", error);
}
</script>

<template>
  <div class="cesium-page">
    <ReCesiumMap
      height="calc(100vh - 200px)"
      @ready="handleReady"
      @error="handleError"
    />
  </div>
</template>

<style lang="scss" scoped>
.cesium-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__header {
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
