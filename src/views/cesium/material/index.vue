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
    <div class="cesium-page__toolbar">
      <el-button
        type="primary"
        @click="() => materialDemo.startDrawing(viewer)"
      >
        开始绘制流动线
      </el-button>
      <el-button type="danger" plain @click="() => materialDemo.clearPath()">
        清除轨迹
      </el-button>
    </div>
    <div class="cesium-page__map">
      <ReCesiumMap height="100%" @ready="handleReady" @error="handleError" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cesium-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 120px);

  .cesium-page__toolbar {
    position: absolute;
    top: 40px;
    left: 40px;
    z-index: 1;
  }

  &__toolbar {
    display: flex;
    gap: 12px;
  }

  &__map {
    flex: 1;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
  }

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
