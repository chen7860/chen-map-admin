# Cesium 飞线轨迹流动

<a class="demo-link" href="/cesium/flow-line" target="_blank">打开主应用 Demo：/cesium/flow-line</a>

## 功能简介

飞线适合表达空间流向，比如调度中心到各节点的数据流、车辆轨迹、事件扩散、物流路径等。

这个功能的重点不是堆叠很多特效，而是让用户快速看出：

- 从哪里出发
- 流向哪些节点
- 哪些路径正在活跃

## 实现思路

1. 用中心点和目标点生成弧线坐标。
2. 使用 `PolylineGlowMaterialProperty` 绘制发光路径。
3. 用 `CallbackProperty` 让光点沿弧线移动。
4. 给每个目标点添加小型标签，避免大面积遮挡底图。

## 关键点

```ts
const positions = Cesium.Cartesian3.fromDegreesArrayHeights(points);

viewer.entities.add({
  polyline: {
    positions,
    width: 4,
    material: new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.22,
      color: color.withAlpha(0.82)
    })
  }
});
```

## 设计建议

- 飞线数量不要太多，6 到 12 条更容易阅读。
- 颜色应服务于状态表达，不要每条线都用高饱和颜色。
- 光点比粗线更重要，动态流动能让用户自然理解方向。
