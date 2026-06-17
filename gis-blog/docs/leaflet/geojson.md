# Leaflet GeoJSON 点线面渲染

<a class="demo-link" href="/leaflet/geo-json-render" target="_blank">打开主应用 Demo：/leaflet/geo-json-render</a>

## 功能简介

GeoJSON 是 WebGIS 中最常见的数据格式之一，适合表达点、线、面等轻量空间数据。

在 Leaflet 中，可以用 `L.geoJSON` 快速完成渲染，并通过 `style`、`pointToLayer`、`onEachFeature` 控制样式和交互。

## 常见用途

- 点：站点、设备、告警位置。
- 线：道路、轨迹、管线、步行路线。
- 面：行政区、业务范围、覆盖区域。

## 实现思路

1. 准备 `FeatureCollection` 数据。
2. 根据 `properties.kind` 做分类样式。
3. 点数据用 `circleMarker` 增强视觉控制。
4. 点击要素时显示名称、类型和描述。

## 扩展方向

- 接入接口返回的 GeoJSON。
- 支持图层开关。
- 支持按属性过滤。
- 支持自动缩放到 GeoJSON 范围。
