<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import * as Cesium from "cesium";
import type { Viewer } from "cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { message } from "@/utils/message";
import WeatherEffect, {
  type WeatherEffectOptions
} from "@/utils/cesium/rainEffect";

defineOptions({
  name: "CesiumRain"
});

const toolList = [
  {
    label: "小雨",
    config: {
      type: "rain",
      tiltAngle: -0.12,
      size: 1,
      speed: 125,
      density: 1.2,
      opacity: 0.38
    }
  },
  {
    label: "中雨",
    config: {
      type: "rain",
      tiltAngle: -0.18,
      size: 0.62,
      speed: 105,
      density: 1.9,
      opacity: 0.52
    }
  },
  {
    label: "大雨",
    config: {
      type: "rain",
      tiltAngle: -0.26,
      size: 0.34,
      speed: 78,
      density: 3.1,
      opacity: 0.6
    }
  },
  {
    label: "小雪",
    config: {
      type: "snow",
      tiltAngle: -0.12,
      size: 1.22,
      speed: 118,
      density: 0.98,
      opacity: 0.62
    }
  },
  {
    label: "大雪",
    config: {
      type: "snow",
      tiltAngle: -0.24,
      size: 1.12,
      speed: 68,
      density: 1.26,
      opacity: 0.66
    }
  },
  {
    label: "刮风",
    config: {
      type: "wind",
      tiltAngle: -0.42,
      size: 0.88,
      speed: 42,
      density: 1.18,
      opacity: 0.62
    }
  }
] as const satisfies ReadonlyArray<{
  label: string;
  config: WeatherEffectOptions;
}>;
type ToolType = (typeof toolList)[number]["label"];

const WEATHER_FLAT_PITCH_DEGREES = -16;
const WEATHER_FLAT_MAX_HEIGHT = 1000;

const active = ref<ToolType | "">("");
let weatherEffect: WeatherEffect | null = null;
let viewer: Viewer | null = null;
let isMapReady = false;

function handleChangeTool(item: (typeof toolList)[number]) {
  if (!isMapReady) {
    message("地图尚未初始化完成", { type: "warning" });
    return;
  }

  weatherEffect?.start(item.config);
  flattenWeatherView(item.config.type);
  active.value = item.label;
}

function flattenWeatherView(type: WeatherEffectOptions["type"]) {
  if (!viewer || type === "wind") return;

  const { camera } = viewer;
  const cartographic = Cesium.Cartographic.fromCartesian(camera.positionWC);
  const height = Math.min(cartographic.height, WEATHER_FLAT_MAX_HEIGHT);

  camera.flyTo({
    destination: Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      height
    ),
    orientation: {
      heading: camera.heading,
      pitch: Cesium.Math.toRadians(WEATHER_FLAT_PITCH_DEGREES),
      roll: camera.roll
    },
    duration: 0.6
  });
}

function handleStop() {
  weatherEffect?.stop();
  active.value = "";
}

function handleReady(instance: Viewer) {
  viewer = instance;
  weatherEffect = new WeatherEffect(instance);
  instance.scene.backgroundColor = Cesium.Color.fromCssColorString("#07111f");
  instance.scene.globe.baseColor = Cesium.Color.fromCssColorString("#101c2c");
  instance.scene.skyAtmosphere.saturationShift = -0.72;
  instance.scene.skyAtmosphere.brightnessShift = -0.42;
  instance.scene.atmosphere.saturationShift = -0.34;
  instance.scene.atmosphere.brightnessShift = -0.18;
  instance.scene.fog.enabled = true;
  instance.scene.fog.density = 0.00042;
  instance.scene.fog.minimumBrightness = 0.02;
  instance.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(113.150014, 23.0498, 4200),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-42),
      roll: 0
    },
    duration: 0
  });
  isMapReady = true;
}

function handleError(error: unknown) {
  console.error("Cesium rain init failed", error);
}

onBeforeUnmount(() => {
  weatherEffect?.stop();
  weatherEffect = null;
  viewer = null;
  isMapReady = false;
});
</script>

<template>
  <div class="cesium-page">
    <div class="tool">
      <div class="list">
        <div
          v-for="item in toolList"
          :key="item.label"
          :class="{ item: true, active: active === item.label }"
          @click="handleChangeTool(item)"
        >
          {{ item.label }}
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
