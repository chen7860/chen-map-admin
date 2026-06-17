import { defineConfig } from "vitepress";

export default defineConfig({
  title: "GIS Lab",
  description: "WebGIS 功能实验室：Cesium、Leaflet 与空间可视化笔记",
  lang: "zh-CN",
  cleanUrls: true,
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "首页", link: "/" },
      { text: "Cesium", link: "/cesium/rain" },
      { text: "Leaflet", link: "/leaflet/geojson" },
      { text: "Demo", link: "/demos" }
    ],
    sidebar: {
      "/cesium/": [
        {
          text: "Cesium",
          items: [
            { text: "雨雪天气效果", link: "/cesium/rain" },
            { text: "飞线轨迹流动", link: "/cesium/flow-line" }
          ]
        }
      ],
      "/leaflet/": [
        {
          text: "Leaflet",
          items: [
            { text: "GeoJSON 渲染", link: "/leaflet/geojson" },
            { text: "地图交互增强", link: "/leaflet/map-interaction" }
          ]
        }
      ]
    },
    socialLinks: [],
    search: {
      provider: "local"
    }
  }
});
