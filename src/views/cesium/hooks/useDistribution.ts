import {
  Cartesian3,
  Color,
  type Entity,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer
} from "cesium";

const distributionPoints = [
  { id: "beijing", name: "北京", position: [116.4074, 39.9042], color: "#409eff" },
  { id: "shanghai", name: "上海", position: [121.4737, 31.2304], color: "#67c23a" },
  { id: "guangzhou", name: "广州", position: [113.2644, 23.1291], color: "#e6a23c" },
  { id: "shenzhen", name: "深圳", position: [114.0579, 22.5431], color: "#f56c6c" }
];

export function useDistribution() {
  const entities: Entity[] = [];
  let clickHandler: ScreenSpaceEventHandler | null = null;

  function init(viewer: Viewer) {
    viewer.entities.removeAll();

    distributionPoints.forEach(point => {
      const entity = viewer.entities.add({
        id: point.id,
        name: point.name,
        position: Cartesian3.fromDegrees(point.position[0], point.position[1], 0),
        point: {
          pixelSize: 14,
          color: Color.fromCssColorString(point.color),
          outlineColor: Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: point.name,
          fillColor: Color.WHITE,
          showBackground: true,
          backgroundColor: Color.fromCssColorString("#1f2d3d").withAlpha(0.8),
          pixelOffset: new Cartesian3(0, -24, 0)
        }
      });

      entities.push(entity);
    });

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(108, 33, 6000000)
    });

    clickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    clickHandler.setInputAction(movement => {
      const picked = viewer.scene.pick(movement.position);
      if (!picked || !("id" in picked) || !picked.id) return;
      const pickedEntity = picked.id as Entity;
      viewer.selectedEntity = pickedEntity;
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  function destroy(viewer?: Viewer | null) {
    clickHandler?.destroy();
    clickHandler = null;

    if (!viewer) {
      entities.length = 0;
      return;
    }

    entities.forEach(entity => {
      viewer.entities.remove(entity);
    });
    entities.length = 0;
  }

  return {
    init,
    destroy
  };
}
