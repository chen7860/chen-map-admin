<script setup lang="ts">
import L from "leaflet";
import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { Map as LeafletMap } from "leaflet";
import ReLeafletMap from "@/components/ReLeafletMap";
import { message } from "@/utils/message";
import { VectorTile, type VectorTileFeature } from "chw-gis-lodash/leaflet";

defineOptions({
  name: "LeafletVectorTile"
});

const defaultUrl = `${import.meta.env.BASE_URL}pdf/1958402946340061186/{z}/{x}/{y}.pbf`;

const dataBounds: [[number, number], [number, number]] = [
  [22.9989, 113.1152],
  [23.0393, 113.1592]
];

const pbfUrl = ref(defaultUrl);
const layerName = ref("");
const lineColor = ref("#ffff00"); // 线条颜色（支持 rgba 透明度）
const fillColor = ref("rgba(255, 0, 0, 0.2)"); // 填充颜色（支持 rgba 透明度）
const loading = ref(false); // 瓦片加载状态
const layerNames = ref<string[]>([]); // 自动发现的图层名（用于点击填入）
const mapRef = shallowRef<LeafletMap | null>(null);
// 矢量瓦片实例（状态式 API），整个页面生命周期只创建一次
let tile: VectorTile | null = null;

// 把颜色字符串（hex 或 rgba）拆成纯色 + 透明度。
// el-color-picker 开启 show-alpha 后，带透明度时返回 rgba()，否则返回 hex。
function parseColor(value: string): { color: string; alpha: number } {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (match) {
    const parts = match[1].split(",").map(item => item.trim());
    const alpha = parts[3] !== undefined ? Number(parts[3]) : 1;
    return { color: `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`, alpha };
  }
  return { color: value, alpha: 1 };
}

// 当前颜色对应的样式（线条 / 填充各自带透明度）
function currentStyle() {
  const line = parseColor(lineColor.value);
  const fill = parseColor(fillColor.value);
  return {
    color: line.color,
    opacity: line.alpha,
    fillColor: fill.color,
    fillOpacity: fill.alpha
  };
}

// 应用样式：指定图层名 → 只改该图层；否则改全局。状态式，无需重新 load
function applyStyle() {
  if (!tile) return;
  const name = layerName.value.trim();
  if (name) tile.setLayerStyle(name, currentStyle());
  else tile.setStyle(currentStyle());
}

// 加载 / 重新加载瓦片
function loadTile() {
  if (!tile) return;
  const url = pbfUrl.value.trim();
  if (!url) {
    message("请填写 PBF 瓦片地址", { type: "warning" });
    return;
  }
  loading.value = true;
  layerNames.value = [];
  tile.load(url);
  applyStyle();
}

// 颜色 / 图层名变化时实时改样式（不重新 load）
watch([lineColor, fillColor, layerName], applyStyle);

// 地图就绪：创建实例、绑定事件、定位并首次加载
function handleReady(map: LeafletMap) {
  mapRef.value = map;
  map.fitBounds(dataBounds, { padding: [20, 20] });

  tile = new VectorTile(map);
  tile
    .on("loading", () => (loading.value = true))
    .on("load", () => (loading.value = false))
    .on("error", () => {
      loading.value = false;
      message("瓦片加载失败，请检查地址或服务是否可用", { type: "error" });
    })
    .onLayerNames((names: string[]) => {
      layerNames.value = names;
      // 未指定图层名时，自动选用第一个真实图层名
      if (!layerName.value && names.length) layerName.value = names[0];
    })
    // 点击要素：把属性渲染成 popup 展示
    .onClick((feature: VectorTileFeature) => {
      const entries = Object.entries(feature.properties);
      const html = entries.length
        ? entries
            .map(([key, value]) => `<div><b>${key}</b>: ${value}</div>`)
            .join("")
        : "无属性";
      L.popup()
        .setLatLng(feature.latlng)
        .setContent(`<div style="max-height:200px;overflow:auto">${html}</div>`)
        .openOn(map);
    });

  loadTile();
}

onBeforeUnmount(() => {
  tile?.destroy();
  tile = null;
});
</script>

<template>
  <div class="vector-tile-page">
    <ReLeafletMap height="calc(100vh - 150px)" @ready="handleReady" />

    <section class="vector-tile-panel">
      <header>
        <strong>PBF 矢量瓦片</strong>
        <span v-if="loading">加载中…</span>
      </header>

      <el-input
        v-model="pbfUrl"
        type="textarea"
        :rows="3"
        placeholder="http://host/{z}/{x}/{y}.pbf"
        size="small"
      />

      <el-input
        v-model="layerName"
        placeholder="图层名（留空则对所有图层生效）"
        size="small"
        style="margin-top: 10px"
      >
        <template #prepend>图层</template>
      </el-input>

      <div class="vector-tile-panel__colors">
        <label>
          线条
          <el-color-picker v-model="lineColor" show-alpha size="small" />
        </label>
        <label>
          填充
          <el-color-picker v-model="fillColor" show-alpha size="small" />
        </label>
      </div>

      <el-button
        type="primary"
        size="small"
        :loading="loading"
        style="width: 100%"
        @click="loadTile"
      >
        加载瓦片
      </el-button>

      <div v-if="layerNames.length" class="vector-tile-panel__layers">
        <div class="vector-tile-panel__layers-title">
          图层名（{{ layerNames.length }}）
        </div>
        <el-tag
          v-for="name in layerNames"
          :key="name"
          size="small"
          :type="name === layerName ? 'primary' : 'info'"
          style="margin: 2px 4px 2px 0; cursor: pointer"
          @click="layerName = name"
        >
          {{ name }}
        </el-tag>
      </div>

      <p class="vector-tile-panel__tip">
        地址需包含 <code>{z}/{x}/{y}</code> 占位符；点击要素可查看属性。
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.vector-tile-page {
  position: relative;
}

.vector-tile-panel {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 500;
  width: 300px;
  padding: 14px;
  color: #1f2933;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(15 23 42 / 10%);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 16%);
  backdrop-filter: blur(8px);

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    span {
      font-size: 12px;
      color: #1677ff;
    }
  }

  &__colors {
    display: flex;
    gap: 16px;
    margin: 10px 0;

    label {
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 13px;
      color: #475569;
    }
  }

  &__layers {
    margin-top: 12px;

    &-title {
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
  }

  &__tip {
    margin: 10px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;

    code {
      padding: 1px 4px;
      background: rgb(15 23 42 / 6%);
      border-radius: 3px;
    }
  }
}
</style>
