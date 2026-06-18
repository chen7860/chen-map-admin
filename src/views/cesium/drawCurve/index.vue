<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import type { Viewer } from "cesium";
import { CesiumDrawController } from "chw-gis-lodash/cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { message } from "@/utils/message";

defineOptions({
  name: "CesiumDrawCurve"
});

const toolList = ["矩形", "圆形", "曲线"] as const;
type ToolType = (typeof toolList)[number];

const active = ref<ToolType | "">("");
let drawer: CesiumDrawController | null = null;
let isMapReady = false;

function startDraw(tool: ToolType) {
  drawer?.clearAll();
  active.value = tool;

  switch (tool) {
    case "矩形":
      drawer?.drawRectangle();
      break;
    case "圆形":
      drawer?.drawCircle();
      break;
    case "曲线":
      drawer?.drawCurve(undefined, curveGeojson => {
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
  if (!drawer) return;

  switch (active.value) {
    case "矩形":
      drawer.clearRectangle();
      break;
    case "圆形":
      drawer.clearCircle();
      break;
    case "曲线":
      drawer.clearCurve();
      break;
    default:
      drawer.clearAll();
      break;
  }
}

function handleReady(instance: Viewer) {
  drawer = new CesiumDrawController({
    fillColor: "#7F4538",
    onMessage(text, type) {
      message(text, { type });
    }
  });
  drawer.init(instance);
  isMapReady = true;
}

function handleError(error: unknown) {
  console.error("Cesium draw init failed", error);
}

onBeforeUnmount(() => {
  drawer?.destroy();
  drawer = null;
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
  top: 10px;
  left: 8px;
  z-index: 10;
  display: flex;

  .list {
    display: flex;
    background-color: rgb(255 255 255);
    border-radius: 4px;

    .item {
      width: 70px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      cursor: pointer;
      border-right: 1px solid #ccc;

      &.active {
        color: #fff;
        background: #209fdb;
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
    line-height: 30px;
    text-align: center;
    cursor: pointer;
    background-color: rgb(255 255 255);
    border-radius: 4px;
  }
}
</style>
