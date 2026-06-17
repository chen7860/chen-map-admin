<script setup lang="ts">
import type { Viewer } from "cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { useCesiumViewer } from "../hooks/useCesiumViewer";
import { useFlowLine } from "../hooks/useFlowLine";

defineOptions({
  name: "CesiumFlowLine"
});

const { viewer, setViewer } = useCesiumViewer();
const flowLine = useFlowLine();

function handleReady(instance: Viewer) {
  flowLine.destroy(viewer.value);
  setViewer(instance);
  flowLine.init(instance);
}

function handleError(error: unknown) {
  console.error("Cesium flow line init failed", error);
}
</script>

<template>
  <div class="flow-line-page">
    <ReCesiumMap
      height="calc(100vh - 150px)"
      @ready="handleReady"
      @error="handleError"
    />

    <header class="flow-line-page__header">
      <span>FLOW TRAJECTORY</span>
      <strong>千灯湖飞线调度</strong>
    </header>

    <section class="flow-line-panel">
      <header>
        <strong>流向节点</strong>
        <span>{{ flowLine.targets.length }} 条</span>
      </header>
      <ul>
        <li v-for="target in flowLine.targets" :key="target.name">
          <i :style="{ background: target.color }" />
          <span>{{ target.name }}</span>
        </li>
      </ul>
    </section>

    <footer class="flow-line-toolbar">
      <el-button type="primary" @click="flowLine.flyHome">回到总览</el-button>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.flow-line-page {
  position: relative;
  min-height: calc(100vh - 150px);
  overflow: hidden;
  color: #f8fbff;
  background: #050914;

  :deep(.re-cesium-map) {
    border-radius: 8px;
  }

  :deep(.cesium-widget-credits) {
    display: none !important;
  }
}

.flow-line-page__header {
  position: absolute;
  top: 18px;
  left: 50%;
  z-index: 10;
  display: grid;
  gap: 4px;
  width: min(420px, calc(100% - 48px));
  padding: 10px 22px 12px;
  text-align: center;
  background: linear-gradient(
    90deg,
    rgb(0 212 255 / 0%),
    rgb(0 212 255 / 16%),
    rgb(21 255 165 / 10%),
    rgb(0 212 255 / 0%)
  );
  border-bottom: 1px solid rgb(0 212 255 / 34%);
  transform: translateX(-50%);

  span {
    font-size: 12px;
    color: rgb(248 251 255 / 66%);
  }

  strong {
    font-size: 22px;
    line-height: 1.2;
    color: #ffffff;
    letter-spacing: 0;
    text-shadow: 0 0 18px rgb(0 212 255 / 58%);
  }
}

.flow-line-panel {
  position: absolute;
  top: 96px;
  left: 18px;
  z-index: 10;
  width: 220px;
  padding: 12px;
  background: linear-gradient(180deg, rgb(5 12 28 / 78%), rgb(5 12 28 / 46%));
  border: 1px solid rgb(0 212 255 / 18%);
  border-radius: 8px;
  box-shadow: 0 18px 46px rgb(0 0 0 / 28%);
  backdrop-filter: blur(10px);

  header,
  li {
    display: flex;
    align-items: center;
  }

  header {
    justify-content: space-between;
    margin-bottom: 10px;
  }

  strong {
    color: #ffffff;
  }

  header span {
    font-size: 12px;
    color: #15ffa5;
  }

  ul {
    display: grid;
    gap: 8px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li {
    gap: 8px;
    padding: 7px 8px;
    font-size: 13px;
    color: rgb(248 251 255 / 78%);
    background: rgb(255 255 255 / 5%);
    border-radius: 6px;
  }

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-shadow: 0 0 12px currentColor;
  }
}

.flow-line-toolbar {
  position: absolute;
  bottom: 18px;
  left: 50%;
  z-index: 10;
  padding: 8px;
  background: rgb(5 12 28 / 62%);
  border: 1px solid rgb(0 212 255 / 14%);
  border-radius: 8px;
  transform: translateX(-50%);
  backdrop-filter: blur(10px);
}
</style>
