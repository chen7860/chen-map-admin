import * as Cesium from "cesium";
import type { Entity, Viewer } from "cesium";

interface FlowTarget {
  name: string;
  lng: number;
  lat: number;
  color: string;
}

const center = {
  name: "千灯湖调度中心",
  lng: 113.150014,
  lat: 23.057504
};

const targets: FlowTarget[] = [
  { name: "金融高新区", lng: 113.1571, lat: 23.0542, color: "#00d4ff" },
  { name: "千灯湖公园", lng: 113.1455, lat: 23.0594, color: "#15ffa5" },
  { name: "万达广场", lng: 113.1548, lat: 23.0509, color: "#fadb14" },
  { name: "礌岗公园", lng: 113.1431, lat: 23.0526, color: "#ff7a45" },
  { name: "桂城片区", lng: 113.1388, lat: 23.0609, color: "#7c4dff" },
  { name: "南海大道", lng: 113.1608, lat: 23.0615, color: "#ff4d4f" }
];

const overviewCamera = {
  lng: center.lng + 0.004,
  lat: center.lat - 0.042,
  height: 5800
};

function createArcPositions(target: FlowTarget) {
  const points: number[] = [];
  const steps = 72;

  for (let index = 0; index <= steps; index += 1) {
    const rate = index / steps;
    const lng = Cesium.Math.lerp(center.lng, target.lng, rate);
    const lat = Cesium.Math.lerp(center.lat, target.lat, rate);
    const height = Math.sin(Math.PI * rate) * 850 + 60;

    points.push(lng, lat, height);
  }

  return Cesium.Cartesian3.fromDegreesArrayHeights(points);
}

function createMovingPosition(positions: Cesium.Cartesian3[], delay: number) {
  return new Cesium.CallbackPositionProperty(() => {
    const index = Math.floor((Date.now() / 42 + delay) % positions.length);

    return positions[index];
  }, false);
}

export function useFlowLine() {
  const entities: Entity[] = [];
  let viewer: Viewer | null = null;
  let osmBuildings: Cesium.Cesium3DTileset | null = null;

  function addEntity(entity: Entity.ConstructorOptions) {
    if (!viewer) return;
    entities.push(viewer.entities.add(entity));
  }

  async function addOsmBuildings() {
    if (!viewer) return;

    const activeViewer = viewer;

    try {
      const tileset = await Cesium.createOsmBuildingsAsync({
        defaultColor: Cesium.Color.fromCssColorString("#d7f2ff").withAlpha(0.96)
      });

      if (!viewer || viewer !== activeViewer || activeViewer.isDestroyed()) {
        tileset.destroy();
        return;
      }

      osmBuildings = activeViewer.scene.primitives.add(tileset);
    } catch (error) {
      console.error("Cesium OSM buildings load failed", error);
    }
  }

  function setupScene(instance: Viewer) {
    const scene = instance.scene;

    scene.globe.depthTestAgainstTerrain = false;
    scene.globe.enableLighting = false;
    scene.skyAtmosphere.show = true;
    scene.fog.enabled = false;
    scene.postProcessStages.fxaa.enabled = true;
    instance.clock.shouldAnimate = true;

    instance.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        overviewCamera.lng,
        overviewCamera.lat,
        overviewCamera.height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-52),
        roll: 0
      },
      duration: 1.4
    });
  }

  function addHub() {
    addEntity({
      name: center.name,
      position: Cesium.Cartesian3.fromDegrees(center.lng, center.lat, 120),
      point: {
        pixelSize: 18,
        color: Cesium.Color.fromCssColorString("#15ffa5"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: center.name,
        font: "15px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.72),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }

  function addFlowLines() {
    targets.forEach((target, targetIndex) => {
      const color = Cesium.Color.fromCssColorString(target.color);
      const positions = createArcPositions(target);

      addEntity({
        name: `${target.name}飞线`,
        polyline: {
          positions,
          width: 4,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.22,
            taperPower: 0.75,
            color: color.withAlpha(0.82)
          })
        }
      });

      addEntity({
        name: `${target.name}流动光点`,
        position: createMovingPosition(positions, targetIndex * 11),
        point: {
          pixelSize: 11,
          color: Cesium.Color.WHITE,
          outlineColor: color,
          outlineWidth: 4,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      addEntity({
        name: target.name,
        position: Cesium.Cartesian3.fromDegrees(target.lng, target.lat, 90),
        point: {
          pixelSize: 10,
          color,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.86),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: target.name,
          font: "13px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, 18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    });
  }

  function init(instance: Viewer) {
    viewer = instance;
    setupScene(instance);
    void addOsmBuildings();
    addHub();
    addFlowLines();
  }

  function flyHome() {
    if (!viewer) return;
    setupScene(viewer);
  }

  function destroy(instance?: Viewer | null) {
    const target = instance ?? viewer;

    if (target) {
      entities.forEach(entity => target.entities.remove(entity));
      if (osmBuildings && !target.isDestroyed()) {
        target.scene.primitives.remove(osmBuildings);
      }
    }

    entities.length = 0;
    osmBuildings = null;
    viewer = null;
  }

  return {
    init,
    flyHome,
    destroy,
    targets
  };
}
