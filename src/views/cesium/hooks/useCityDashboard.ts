import * as Cesium from "cesium";
import type { Cesium3DTileset, Entity, Viewer } from "cesium";

interface CityPoint {
  name: string;
  type: "alert" | "camera" | "station" | "patrol";
  lng: number;
  lat: number;
  value: number;
}

const center = {
  lng: 113.150014,
  lat: 23.057504
};

function displayLat(lat: number) {
  return lat;
}

const cityPoints: CityPoint[] = [
  { name: "千灯湖站", type: "station", lng: 113.150014, lat: 23.057504, value: 98 },
  { name: "湖岸西北监控", type: "camera", lng: 113.14692, lat: 23.05928, value: 82 },
  { name: "商办东北岗亭", type: "patrol", lng: 113.15325, lat: 23.05785, value: 76 },
  { name: "湖岸南侧闸口", type: "alert", lng: 113.14882, lat: 23.0552, value: 91 },
  { name: "商办东南摄像头", type: "camera", lng: 113.15335, lat: 23.05538, value: 69 },
  { name: "公园北侧闸口", type: "patrol", lng: 113.1492, lat: 23.05968, value: 73 }
];

function getPointColor(type: CityPoint["type"]) {
  const colorMap = {
    alert: Cesium.Color.fromCssColorString("#ff4d4f"),
    camera: Cesium.Color.fromCssColorString("#00d4ff"),
    station: Cesium.Color.fromCssColorString("#52c41a"),
    patrol: Cesium.Color.fromCssColorString("#fadb14")
  };

  return colorMap[type];
}

export function useCityDashboard() {
  const entities: Entity[] = [];
  let viewer: Viewer | null = null;
  let osmBuildings: Cesium3DTileset | null = null;

  function addEntity(entity: Entity.ConstructorOptions) {
    if (!viewer) return null;
    const result = viewer.entities.add(entity);
    entities.push(result);
    return result;
  }

  function setupScene(instance: Viewer) {
    const scene = instance.scene;

    scene.globe.enableLighting = true;
    scene.globe.depthTestAgainstTerrain = false;
    scene.skyAtmosphere.show = true;
    scene.fog.enabled = true;
    scene.fog.density = 0.00018;
    scene.postProcessStages.fxaa.enabled = true;
    instance.clock.shouldAnimate = true;

    instance.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        center.lng,
        displayLat(center.lat) - 0.004,
        2200
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-58),
        roll: 0
      },
      duration: 1.8
    });
  }

  async function addOsmBuildings() {
    if (!viewer) return;

    try {
      osmBuildings = await Cesium.createOsmBuildingsAsync({
        style: new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['building']} === 'hospital'", "color('#ff6b6b', 0.92)"],
              ["${feature['building']} === 'commercial'", "color('#35d0ff', 0.86)"],
              ["${feature['building']} === 'residential'", "color('#cfd8dc', 0.82)"],
              ["true", "color('#ffffff', 0.78)"]
            ]
          }
        })
      });
      osmBuildings.maximumScreenSpaceError = 2;
      viewer.scene.primitives.add(osmBuildings);
    } catch (error) {
      console.warn("Cesium OSM Buildings 加载失败", error);
    }
  }

  function addLinesAndPoints() {
    cityPoints.forEach(point => {
      const color = getPointColor(point.type);
      const showLabel = point.type === "alert" || point.type === "station";

      addEntity({
        name: point.name,
        position: Cesium.Cartesian3.fromDegrees(
          point.lng,
          displayLat(point.lat),
          120
        ),
        point: {
          pixelSize: point.type === "alert" ? 15 : 10,
          color: color.withAlpha(0.95),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.82),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          show: showLabel,
          text: point.name,
          font: "13px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.78),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      addEntity({
        name: `${point.name}联动线`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            center.lng,
            displayLat(center.lat),
            90,
            (center.lng + point.lng) / 2,
            displayLat((center.lat + point.lat) / 2),
            240,
            point.lng,
            displayLat(point.lat),
            90
          ]),
          width: point.type === "alert" ? 3 : 2,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.12,
            taperPower: 0.7,
            color: color.withAlpha(point.type === "alert" ? 0.75 : 0.42)
          })
        }
      });
    });
  }

  function addLakeArea() {
    addEntity({
      name: "千灯湖核心态势区",
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          113.14505, displayLat(23.0571),
          113.14692, displayLat(23.05928),
          113.1492, displayLat(23.05968),
          113.15325, displayLat(23.05785),
          113.15335, displayLat(23.05538),
          113.14882, displayLat(23.0552)
        ]),
        material: Cesium.Color.fromCssColorString("#00d4ff").withAlpha(0.045),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#00d4ff").withAlpha(0.58)
      }
    });
  }

  async function init(instance: Viewer) {
    viewer = instance;
    setupScene(instance);
    await addOsmBuildings();
    addLakeArea();
    addLinesAndPoints();
  }

  function flyHome() {
    if (!viewer) return;
    setupScene(viewer);
  }

  function destroy(instance?: Viewer | null) {
    const target = instance ?? viewer;

    if (target) {
      entities.forEach(entity => target.entities.remove(entity));
      if (osmBuildings) {
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
    cityPoints
  };
}
