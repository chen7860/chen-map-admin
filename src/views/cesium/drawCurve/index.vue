<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import type { Viewer } from "cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import BaseDraw from "@/utils/cesium/draw";
import { message } from "@/utils/message";

defineOptions({
  name: "CesiumDrawCurve"
});

const toolList = ["矩形", "圆形", "曲线"] as const;
type ToolType = (typeof toolList)[number];

const active = ref<ToolType | "">("");
let baseDraw: BaseDraw | null = null;
let isMapReady = false;

function ensureDrawer() {
  if (!baseDraw) {
    baseDraw = new BaseDraw();
  }
}

function startDraw(tool: ToolType) {
  ensureDrawer();
  baseDraw?.clearAll();
  active.value = tool;
  message("单击屏幕开始绘制，右键结束绘制", { type: "info" });

  switch (tool) {
    case "矩形":
      baseDraw?.drawRectangle();
      break;
    case "圆形":
      baseDraw?.drawCircle("#7F4538");
      break;
    case "曲线":
      baseDraw?.drawCurve("#7F4538", curveGeojson => {
        console.log("曲线绘制结果:", curveGeojson);
      });
      break;
  }
}

function handleChangeTool(item: ToolType) {
  if (!isMapReady) {
    message("地图尚未初始化完成", { type: "warning" });
    return;
  }
  startDraw(item);
}

function handleClear() {
  if (!baseDraw) return;

  switch (active.value) {
    case "矩形":
      baseDraw.clearRectangle();
      break;
    case "圆形":
      baseDraw.clearCircle();
      break;
    case "曲线":
      baseDraw.clearCurve();
      break;
    default:
      baseDraw.clearAll();
      return;
  }

  message("当前图形已清除", { type: "success" });
}

function handleReady(instance: Viewer) {
  // 兼容 draw 工具中通过 window.viewer 取 Cesium 实例的实现方式
  (window as any).viewer = instance;
  isMapReady = true;
}

function handleError(error: unknown) {
  console.error("Cesium draw init failed", error);
}

onBeforeUnmount(() => {
  baseDraw?.clearAll();
  isMapReady = false;
});
</script>

<template>
  <div class="cesium-page">
    <div class="tool">
      <div class="list">
        <div
          v-for="item in toolList"
          :key="item"
          :class="{ item: true, active: active === item }"
          @click="handleChangeTool(item)"
        >
          {{ item }}
        </div>
      </div>
      <div class="clear" @click="handleClear">清除</div>
    </div>
    <ReCesiumMap
      height="calc(100vh - 150px)"
      @ready="handleReady"
      @error="handleError"
    />
  </div>
</template>

<style lang="scss" scoped>
.cesium-page {
  position: relative;
}

.tool {
  position: absolute;
  z-index: 10;
  top: 10px;
  left: 8px;
  display: flex;

  .list {
    display: flex;
    border-radius: 4px;
    background-color: rgb(255 255 255);

    .item {
      width: 70px;
      height: 30px;
      text-align: center;
      border-right: 1px solid #ccc;
      line-height: 30px;
      cursor: pointer;

      &.active {
        background: #209fdb;
        color: #fff;
      }
    }

    .item:last-child {
      border-right: none;
    }
  }

  .clear {
    width: 70px;
    height: 30px;
    margin-left: 10px;
    text-align: center;
    line-height: 30px;
    cursor: pointer;
    background-color: rgb(255 255 255);
    border-radius: 4px;
  }
}
</style>
