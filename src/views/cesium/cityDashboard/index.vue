<script setup lang="ts">
import type { Viewer } from "cesium";
import ReCesiumMap from "@/components/ReCesiumMap";
import { useCesiumViewer } from "../hooks/useCesiumViewer";
import { useCityDashboard } from "../hooks/useCityDashboard";

defineOptions({
  name: "CesiumCityDashboard"
});

const { viewer, setViewer } = useCesiumViewer();
const dashboard = useCityDashboard();

function handleReady(instance: Viewer) {
  dashboard.destroy(viewer.value);
  setViewer(instance);
  dashboard.init(instance);
}

function handleError(error: unknown) {
  console.error("Cesium city dashboard init failed", error);
}
</script>

<template>
  <div class="city-dashboard">
    <ReCesiumMap
      height="calc(100vh - 150px)"
      @ready="handleReady"
      @error="handleError"
    />

    <header class="city-dashboard__header">
      <span>QIANDENG LAKE</span>
      <strong>千灯湖城市三维态势大屏</strong>
      <em>实时感知 / 联动调度 / 空间态势</em>
    </header>

    <section class="status-panel status-panel--left">
      <header>
        <strong>态势总览</strong>
        <span>LIVE</span>
      </header>
      <div class="metric-grid">
        <div>
          <span>在线点位</span>
          <strong>128</strong>
        </div>
        <div>
          <span>告警处理率</span>
          <strong>96%</strong>
        </div>
        <div>
          <span>巡检覆盖</span>
          <strong>8.6km</strong>
        </div>
        <div>
          <span>联动事件</span>
          <strong>24</strong>
        </div>
      </div>
      <ul class="event-list">
        <li v-for="point in dashboard.cityPoints.slice(0, 4)" :key="point.name">
          <span>{{ point.name }}</span>
          <strong>{{ point.value }}</strong>
        </li>
      </ul>
    </section>

    <section class="status-panel status-panel--right">
      <header>
        <strong>调度能力</strong>
        <span>COMMAND</span>
      </header>
      <div class="bar-list">
        <label>
          <span>视频覆盖</span>
          <i style="--value: 92%" />
        </label>
        <label>
          <span>人员响应</span>
          <i style="--value: 78%" />
        </label>
        <label>
          <span>路网通达</span>
          <i style="--value: 84%" />
        </label>
      </div>
    </section>

    <footer class="city-dashboard__toolbar">
      <el-button type="primary" @click="dashboard.flyHome">回到千灯湖</el-button>
      <el-button plain>态势扫描</el-button>
      <el-button plain>联动调度</el-button>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.city-dashboard {
  position: relative;
  min-height: calc(100vh - 150px);
  overflow: hidden;
  color: #e6f7ff;
  background: #050914;

  :deep(.re-cesium-map) {
    border-radius: 8px;
  }

  :deep(.cesium-widget-credits) {
    display: none !important;
  }
}

.city-dashboard__header {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 10;
  display: grid;
  gap: 2px;
  width: min(460px, calc(100% - 48px));
  padding: 8px 24px 11px;
  text-align: center;
  background: linear-gradient(
    90deg,
    rgb(0 212 255 / 0%),
    rgb(0 212 255 / 18%),
    rgb(21 255 165 / 14%),
    rgb(0 212 255 / 0%)
  );
  border-bottom: 1px solid rgb(0 212 255 / 42%);
  transform: translateX(-50%);

  span,
  em {
    font-size: 12px;
    font-style: normal;
    color: rgb(230 247 255 / 72%);
  }

  strong {
    font-size: 21px;
    line-height: 1.2;
    color: #ffffff;
    letter-spacing: 0;
    text-shadow: 0 0 18px rgb(0 212 255 / 68%);
  }
}

.status-panel {
  position: absolute;
  top: 92px;
  z-index: 10;
  width: 248px;
  padding: 12px;
  background: linear-gradient(180deg, rgb(5 12 28 / 74%), rgb(5 12 28 / 48%));
  border: 1px solid rgb(0 212 255 / 18%);
  border-radius: 8px;
  box-shadow: 0 18px 46px rgb(0 0 0 / 34%);
  backdrop-filter: blur(10px);

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    strong {
      font-size: 16px;
      color: #ffffff;
    }

    span {
      padding: 2px 8px;
      font-size: 11px;
      color: #15ffa5;
      background: rgb(21 255 165 / 12%);
      border: 1px solid rgb(21 255 165 / 28%);
      border-radius: 999px;
    }
  }
}

.status-panel--left {
  left: 18px;
}

.status-panel--right {
  right: 18px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  div {
    min-height: 58px;
    padding: 10px;
    background: rgb(0 212 255 / 5%);
    border: 1px solid rgb(0 212 255 / 12%);
    border-radius: 6px;
  }

  span {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: rgb(230 247 255 / 62%);
  }

  strong {
    font-size: 20px;
    color: #15ffa5;
  }
}

.event-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 10px 0 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 9px;
    background: rgb(255 255 255 / 5%);
    border-left: 2px solid #00d4ff;
  }

  span {
    font-size: 13px;
    color: rgb(230 247 255 / 74%);
  }

  strong {
    color: #fadb14;
  }
}

.bar-list {
  display: grid;
  gap: 12px;

  label {
    display: grid;
    gap: 7px;
  }

  span {
    font-size: 13px;
    color: rgb(230 247 255 / 74%);
  }

  i {
    display: block;
    height: 7px;
    overflow: hidden;
    background: rgb(255 255 255 / 9%);
    border-radius: 999px;

    &::before {
      display: block;
      width: var(--value);
      height: 100%;
      content: "";
      background: linear-gradient(90deg, #00d4ff, #15ffa5);
      border-radius: inherit;
      box-shadow: 0 0 14px rgb(0 212 255 / 72%);
    }
  }
}

.city-dashboard__toolbar {
  position: absolute;
  bottom: 14px;
  left: 50%;
  z-index: 10;
  display: flex;
  gap: 10px;
  padding: 8px;
  background: rgb(5 12 28 / 62%);
  border: 1px solid rgb(0 212 255 / 14%);
  border-radius: 8px;
  transform: translateX(-50%);
  backdrop-filter: blur(10px);
}

@media (max-width: 900px) {
  .status-panel {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    width: auto;
    margin: 12px 0;
  }

  .city-dashboard__toolbar {
    right: 12px;
    bottom: 12px;
    left: 12px;
    justify-content: center;
    transform: none;
  }
}
</style>
