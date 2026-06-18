<script setup lang="ts">
import type { Viewer } from "cesium";
import { CesiumFlowLineController } from "chw-gis-lodash/cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { message } from "@/utils/message";
import { useCesiumViewer } from "../hooks/useCesiumViewer";

defineOptions({
  name: "CesiumMaterial"
});

const { viewer, setViewer } = useCesiumViewer();
const flowLine = new CesiumFlowLineController({
  // 提示文案已内置为默认值，这里只负责展示；
  // 如需自定义文案传 messages，需要额外逻辑用 onDrawStart/onDrawComplete/onDrawCancel
  onMessage(text, type) {
    message(text, { type });
  }
});

function handleReady(instance: Viewer) {
  flowLine.destroy(viewer.value);
  setViewer(instance);
  flowLine.init(instance);
}

function handleError(error: unknown) {
  console.error("Cesium material init failed", error);
}

function clearPath() {
  flowLine.clearPath();
  message("轨迹已清除", { type: "success" });
}
</script>

<template>
  <div class="cesium-page">
    <div class="cesium-page__toolbar">
      <el-button type="primary" @click="() => flowLine.startDrawing()">
        开始绘制流动线
      </el-button>
      <el-button type="danger" plain @click="clearPath"> 清除轨迹 </el-button>
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
    position: relative;
    flex: 1;
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
