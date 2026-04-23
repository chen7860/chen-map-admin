<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import type { Viewer } from "cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { message } from "@/utils/message";
import RainEffect from "@/utils/cesium/rainEffect";

defineOptions({
  name: "CesiumRain"
});

const toolList = ["小雨", "中雨", "大雨"] as const;
type ToolType = (typeof toolList)[number];

const active = ref<ToolType | "">("");
let rainEffect: InstanceType<
  typeof import("@/utils/cesium/rainEffect").default
> | null = null;
let isMapReady = false;

function ensureRain() {
  if (!rainEffect) {
    rainEffect = new RainEffect();
  }
}

function handleChangeTool(item: ToolType) {
  if (!isMapReady) {
    message("地图尚未初始化完成", { type: "warning" });
    return;
  }

  ensureRain();

  switch (item) {
    case "小雨":
      rainEffect?.start({
        tiltAngle: -0.1,
        rainSize: 1,
        rainSpeed: 120.0
      });
      break;
    case "中雨":
      rainEffect?.start({
        tiltAngle: -0.1,
        rainSize: 0.6,
        rainSpeed: 120.0
      });
      break;
    case "大雨":
      rainEffect?.start({
        tiltAngle: -0.1,
        rainSize: 0.2,
        rainSpeed: 120.0
      });
      break;
  }

  active.value = item;
}

function handleStop() {
  rainEffect?.stop();
  active.value = "";
}

function handleReady(instance: Viewer) {
  (window as any).viewer = instance;
  isMapReady = true;
}

function handleError(error: unknown) {
  console.error("Cesium rain init failed", error);
}

onBeforeUnmount(() => {
  rainEffect?.stop();
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
      <div class="clear" @click="handleStop">关闭</div>
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
