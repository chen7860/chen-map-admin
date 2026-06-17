export default {
  path: "/leaflet",
  redirect: "/leaflet/cluster-marker",
  meta: {
    icon: "ep:location",
    title: "Leaflet",
    rank: 9
  },
  children: [
    {
      path: "/leaflet/cluster-marker",
      name: "LeafletClusterMarker",
      component: () => import("@/views/leaflet/clusterMarker/index.vue"),
      meta: {
        title: "聚合marker",
        showParent: true
      }
    },
    {
      path: "/leaflet/canvas-marker",
      name: "LeafletCanvasMarker",
      component: () => import("@/views/leaflet/canvasMarker/index.vue"),
      meta: {
        title: "canvas marker",
        showParent: true
      }
    },
    {
      path: "/leaflet/moving-track",
      name: "LeafletMovingTrack",
      component: () => import("@/views/leaflet/movingTrack/index.vue"),
      meta: {
        title: "移动轨迹图",
        showParent: true
      }
    },
    {
      path: "/leaflet/layer-control",
      name: "LeafletLayerControl",
      component: () => import("@/views/leaflet/layerControl/index.vue"),
      meta: {
        title: "图层控制",
        showParent: true
      }
    },
    {
      path: "/leaflet/geojson-render",
      name: "LeafletGeoJsonRender",
      component: () => import("@/views/leaflet/geoJsonRender/index.vue"),
      meta: {
        title: "GeoJSON 渲染",
        showParent: true
      }
    },
    {
      path: "/leaflet/map-interaction",
      name: "LeafletMapInteraction",
      component: () => import("@/views/leaflet/mapInteraction/index.vue"),
      meta: {
        title: "地图交互增强",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
