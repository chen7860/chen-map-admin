<script setup lang="ts">
import { ref } from "vue";
import type { Viewer } from "cesium";
import { CesiumExcavation } from "chw-gis-lodash/cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { message } from "@/utils/message";
import { useCesiumViewer } from "../hooks/useCesiumViewer";

defineOptions({
  name: "CesiumExcavation"
});

const { setViewer } = useCesiumViewer();
const activeDepth = ref(80);
const isBoxSelecting = ref(false);
let excavation: CesiumExcavation | null = null;

function handleReady(instance: Viewer) {
  excavation?.destroy();
  setViewer(instance);
  excavation = new CesiumExcavation(instance, {
    defaultDepth: activeDepth.value
  });
  excavation.onBoxSelectChange((selecting: boolean) => {
    isBoxSelecting.value = selecting;
  });
}

function handleError(error: unknown) {
  console.error("Cesium excavation init failed", error);
}

function changeDepth(depth: number) {
  if (depth == null || Number.isNaN(depth)) return;
  activeDepth.value = depth;
  excavation?.setDepth(depth);
}

function toggleBoxSelect() {
  if (!excavation) return;

  if (isBoxSelecting.value) {
    excavation.stopBoxSelect();
    return;
  }

  excavation.startBoxSelect();

  if (excavation.isBoxSelecting()) {
    message("框选模式已开启：在地图上按住鼠标左键拖拽，松开后生成开挖范围", {
      type: "info"
    });
  }
}
</script>

<template>
  <div class="excavation-page">
    <ReCesiumMap
      height="calc(100vh - 150px)"
      @ready="handleReady"
      @error="handleError"
    />

    <section class="excavation-panel">
      <header>
        <strong>地形开挖 / 剖切</strong>
        <span>{{ activeDepth }}m</span>
      </header>
      <p>
        点击框选范围后，在地图上按住拖拽，松开后按选区裁切地表并生成开挖坑。
      </p>
      <div v-if="isBoxSelecting" class="select-tip">
        按住鼠标左键拖拽框选，松开完成
      </div>
      <div class="depth-actions">
        <el-input-number
          v-model="activeDepth"
          :min="1"
          :max="100000"
          :step="10"
          controls-position="right"
          size="small"
          @change="changeDepth"
        />
        <span class="depth-unit">m</span>
      </div>
      <el-button
        size="small"
        :type="isBoxSelecting ? 'warning' : 'primary'"
        @click="toggleBoxSelect"
      >
        {{ isBoxSelecting ? "取消框选" : "框选范围" }}
      </el-button>
      <!-- <el-button size="small" plain @click="excavation.flyHome">
        回到视角
      </el-button> -->
    </section>
  </div>
</template>

<style lang="scss" scoped>
.excavation-page {
  position: relative;
  min-height: calc(100vh - 150px);
  overflow: hidden;
  color: #f8fbff;
  background: #07111f;

  :deep(.re-cesium-map) {
    border-radius: 8px;
  }

  :deep(.cesium-widget-credits) {
    display: none !important;
  }
}

.excavation-panel {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 10;
  width: 286px;
  padding: 14px;
  background: linear-gradient(180deg, rgb(7 17 31 / 82%), rgb(7 17 31 / 56%));
  border: 1px solid rgb(51 214 255 / 22%);
  border-radius: 8px;
  box-shadow: 0 18px 46px rgb(0 0 0 / 32%);
  backdrop-filter: blur(10px);

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  strong {
    color: #fff;
  }

  span {
    font-size: 12px;
    color: #33d6ff;
  }

  p {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.7;
    color: rgb(248 251 255 / 72%);
  }
}

.depth-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;

  .depth-unit {
    font-size: 13px;
    color: #33d6ff;
  }
}

.select-tip {
  padding: 8px 10px;
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.4;
  color: #9bd1ff;
  background: rgb(47 140 255 / 12%);
  border: 1px solid rgb(47 140 255 / 38%);
  border-radius: 6px;
}
</style>
