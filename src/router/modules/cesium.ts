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
      path: "/cesium/city-dashboard",
      name: "CesiumCityDashboard",
      component: () => import("@/views/cesium/cityDashboard/index.vue"),
      meta: {
        title: "城市态势"
      }
    },
    {
      path: "/cesium/flow-line",
      name: "CesiumFlowLine",
      component: () => import("@/views/cesium/flowLine/index.vue"),
      meta: {
        title: "飞线轨迹"
      }
    },
    {
      path: "/cesium/excavation",
      name: "CesiumExcavation",
      component: () => import("@/views/cesium/excavation/index.vue"),
      meta: {
        title: "地形开挖"
      }
    },
    {
      path: "/cesium/material",
      name: "CesiumMaterial",
      component: () => import("@/views/cesium/material/index.vue"),
      meta: {
        title: "自定义材质"
      }
    },
    {
      path: "/cesium/drawCurve",
      name: "CesiumDrawCurve",
      component: () => import("@/views/cesium/drawCurve/index.vue"),
      meta: {
        title: "绘制图形"
      }
    },
    {
      path: "/cesium/rain",
      name: "CesiumRain",
      component: () => import("@/views/cesium/rain/index.vue"),
      meta: {
        title: "下雨效果"
      }
    }
  ]
} satisfies RouteConfigsTable;
