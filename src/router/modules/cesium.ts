export default {
  path: "/cesium",
  redirect: "/cesium/distribution",
  meta: {
    icon: "ep:map-location",
    title: "Cesium",
    rank: 8
  },
  children: [
    {
      path: "/cesium/distribution",
      name: "CesiumDistribution",
      component: () => import("@/views/cesium/distribution/index.vue"),
      meta: {
        title: "分布图"
      }
    },
    {
      path: "/cesium/material",
      name: "CesiumMaterial",
      component: () => import("@/views/cesium/material/index.vue"),
      meta: {
        title: "自定义材质"
      }
    }
  ]
} satisfies RouteConfigsTable;
