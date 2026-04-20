<script setup lang="ts">
import type { Viewer } from "cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { useCesiumViewer } from "../hooks/useCesiumViewer";
import { useDistribution } from "../hooks/useDistribution";

defineOptions({
  name: "CesiumDistribution"
});

const { viewer, setViewer } = useCesiumViewer();
const distribution = useDistribution();

function handleReady(instance: Viewer) {
  distribution.destroy(viewer.value);
  setViewer(instance);
  distribution.init(instance);
}

function handleError(error: unknown) {
  console.error("Cesium distribution init failed", error);
}
</script>

<template>
  <div class="cesium-page">
    <ReCesiumMap
      height="calc(100vh - 150px)"
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
