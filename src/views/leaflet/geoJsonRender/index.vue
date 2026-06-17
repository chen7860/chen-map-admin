<script setup lang="ts">
import * as L from "leaflet";
import type {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  Geometry
} from "geojson";
import type { GeoJSON, Map as LeafletMap, PathOptions } from "leaflet";
import { computed, shallowRef } from "vue";
import ReLeafletMap from "@/components/ReLeafletMap";

defineOptions({
  name: "LeafletGeoJsonRender"
});

type FeatureKind = "station" | "route" | "business" | "park" | "waterfront";

interface GeoJsonProperties {
  name: string;
  kind: FeatureKind;
  description: string;
}

const mapRef = shallowRef<LeafletMap | null>(null);
const geoJsonLayer = shallowRef<GeoJSON | null>(null);

const kindConfig: Record<
  FeatureKind,
  {
    label: string;
    color: string;
    fillOpacity: number;
  }
> = {
  station: {
    label: "地铁站点",
    color: "#52c41a",
    fillOpacity: 1
  },
  route: {
    label: "步行连线",
    color: "#e74c3c",
    fillOpacity: 0
  },
  business: {
    label: "商办片区",
    color: "#1677ff",
    fillOpacity: 0.28
  },
  park: {
    label: "公园绿地",
    color: "#13c2c2",
    fillOpacity: 0.28
  },
  waterfront: {
    label: "湖岸活动区",
    color: "#faad14",
    fillOpacity: 0.28
  }
};

const qiandengLakeGeoJson: FeatureCollection<Geometry, GeoJsonProperties> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "千灯湖地铁站",
        kind: "station",
        description: "广佛线千灯湖站，示例 GeoJSON 中心点"
      },
      geometry: {
        type: "Point",
        coordinates: [113.150014, 23.057504]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "站点至湖岸步行线",
        kind: "route",
        description: "从地铁站向千灯湖公园方向的示例步行连线"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [113.150014, 23.057504],
          [113.1492, 23.05818],
          [113.14815, 23.05882],
          [113.14692, 23.05928]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "千灯湖商办片区",
        kind: "business",
        description: "地铁站东南侧商办楼宇示例面"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [113.15035, 23.05795],
            [113.15325, 23.05785],
            [113.15335, 23.05538],
            [113.15025, 23.05538],
            [113.15035, 23.05795]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "千灯湖公园绿地",
        kind: "park",
        description: "千灯湖站西侧公园绿地示例面"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [113.14545, 23.05998],
            [113.1492, 23.05968],
            [113.14905, 23.05722],
            [113.14518, 23.05738],
            [113.14545, 23.05998]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "湖岸活动区",
        kind: "waterfront",
        description: "千灯湖湖岸步道与休闲活动示例范围"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [113.14505, 23.0571],
            [113.14895, 23.05695],
            [113.14882, 23.0552],
            [113.1448, 23.05535],
            [113.14505, 23.0571]
          ]
        ]
      }
    }
  ]
};

const featureCountText = computed(() => {
  const counts = qiandengLakeGeoJson.features.reduce(
    (result, feature) => {
      result[feature.geometry.type] = (result[feature.geometry.type] || 0) + 1;
      return result;
    },
    {} as Record<string, number>
  );

  return `${counts.Point || 0} 点 / ${counts.LineString || 0} 线 / ${
    counts.Polygon || 0
  } 面`;
});

function getFeatureConfig(feature?: Feature<Geometry, GeoJsonProperties>) {
  const kind = feature?.properties?.kind || "business";

  return kindConfig[kind];
}

function getFeatureStyle(feature?: Feature<Geometry, GeoJsonProperties>) {
  const config = getFeatureConfig(feature);

  return {
    color: config.color,
    weight: feature?.properties.kind === "route" ? 5 : 2,
    opacity: 0.95,
    fillColor: config.color,
    fillOpacity: config.fillOpacity,
    lineCap: "round",
    lineJoin: "round"
  } satisfies PathOptions;
}

function createPopupContent(properties: GeoJsonProperties) {
  return `<strong>${properties.name}</strong><br />${properties.description}`;
}

function highlightFeature(layer: L.Layer, feature?: Feature<Geometry>) {
  const pathLayer = layer as L.Path;

  if (typeof pathLayer.setStyle !== "function") return;
  if (feature?.geometry.type === "Point") return;

  pathLayer.setStyle({
    weight: 4,
    fillOpacity: 0.45
  });
}

function resetFeatureStyle(layer: L.Layer, feature?: Feature<Geometry>) {
  if (feature?.geometry.type === "Point") return;

  geoJsonLayer.value?.resetStyle(layer);
}

function renderGeoJson(map: LeafletMap) {
  geoJsonLayer.value?.remove();

  const layer = L.geoJSON(qiandengLakeGeoJson as GeoJsonObject, {
    style: feature =>
      getFeatureStyle(feature as Feature<Geometry, GeoJsonProperties>),
    pointToLayer: (feature, latLng) => {
      const typedFeature = feature as Feature<Geometry, GeoJsonProperties>;
      const config = getFeatureConfig(typedFeature);

      return L.circleMarker(latLng, {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: config.color,
        fillOpacity: 1
      });
    },
    onEachFeature: (feature, layer) => {
      const typedFeature = feature as Feature<Geometry, GeoJsonProperties>;

      layer.bindPopup(createPopupContent(typedFeature.properties));
      layer.on({
        mouseover: () => highlightFeature(layer, typedFeature),
        mouseout: () => resetFeatureStyle(layer, typedFeature)
      });
    }
  }).addTo(map);

  geoJsonLayer.value = layer;
  map.fitBounds(layer.getBounds(), { padding: [42, 42] });
}

function handleReady(map: LeafletMap) {
  mapRef.value = map;
  renderGeoJson(map);
}
</script>

<template>
  <div class="geojson-page">
    <ReLeafletMap height="calc(100vh - 150px)" @ready="handleReady" />

    <section class="geojson-panel">
      <header>
        <strong>GeoJSON 渲染</strong>
        <span>{{ featureCountText }}</span>
      </header>

      <div class="geojson-panel__legend">
        <div
          v-for="[kind, config] in Object.entries(kindConfig)"
          :key="kind"
          class="legend-item"
        >
          <i :style="{ backgroundColor: config.color }" />
          <span>{{ config.label }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.geojson-page {
  position: relative;
}

.geojson-panel {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 500;
  width: 260px;
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
    padding-bottom: 10px;
    border-bottom: 1px solid rgb(15 23 42 / 8%);

    span {
      font-size: 12px;
      color: #64748b;
    }
  }

  &__legend {
    display: grid;
    gap: 9px;
    padding-top: 12px;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;

  i {
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(15 23 42 / 12%);
  }
}
</style>
