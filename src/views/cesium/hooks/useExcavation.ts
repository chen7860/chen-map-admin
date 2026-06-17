import * as Cesium from "cesium";
import type { Entity, Viewer } from "cesium";

type PitPoint = [number, number];

const center = {
  lng: 113.150014,
  lat: 23.057504
};

const defaultPitPoints: PitPoint[] = [
  [113.14912, 23.0581],
  [113.15008, 23.05834],
  [113.15094, 23.05792],
  [113.15108, 23.05714],
  [113.15034, 23.05668],
  [113.14922, 23.05682],
  [113.14888, 23.05742]
] as const;

const depthOptions = [40, 80, 120];
const earthColors = {
  rim: "#ffd37a",
  upperSlope: "#c98f64",
  lowerSlope: "#936447",
  bottom: "#5a3828",
  contour: "#ffe1a3",
  shadow: "#26180f"
};

function toDegreesArray(points: PitPoint[]) {
  return points.flatMap(([lng, lat]) => [lng, lat]);
}

function toDegreesArrayHeights(points: PitPoint[], depth: number) {
  return points.flatMap(([lng, lat]) => [lng, lat, -depth]);
}

function getPitCenter(points: PitPoint[]) {
  const total = points.reduce(
    (result, [lng, lat]) => {
      result.lng += lng;
      result.lat += lat;
      return result;
    },
    { lng: 0, lat: 0 }
  );

  return {
    lng: total.lng / points.length,
    lat: total.lat / points.length
  };
}

function scalePitPoints(points: PitPoint[], scale: number): PitPoint[] {
  const pitCenter = getPitCenter(points);

  return points.map(([lng, lat]) => [
    pitCenter.lng + (lng - pitCenter.lng) * scale,
    pitCenter.lat + (lat - pitCenter.lat) * scale
  ]);
}

function closePoints(points: PitPoint[]) {
  return [...points, points[0]];
}

function getBounds(points: PitPoint[]) {
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);

  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats)
  };
}

function createBoxPoints(start: PitPoint, end: PitPoint): PitPoint[] {
  const minLng = Math.min(start[0], end[0]);
  const maxLng = Math.max(start[0], end[0]);
  const minLat = Math.min(start[1], end[1]);
  const maxLat = Math.max(start[1], end[1]);

  return [
    [minLng, maxLat],
    [maxLng, maxLat],
    [maxLng, minLat],
    [minLng, minLat]
  ];
}

function isValidPit(points: PitPoint[]) {
  const { minLng, maxLng, minLat, maxLat } = getBounds(points);

  return maxLng - minLng > 0.00008 && maxLat - minLat > 0.00008;
}

export function useExcavation() {
  const entities: Entity[] = [];
  let viewer: Viewer | null = null;
  let currentDepth = depthOptions[1];
  let activePitPoints: PitPoint[] = [...defaultPitPoints];
  let hasPit = false;
  let previousClippingPolygons: Cesium.ClippingPolygonCollection | undefined;
  let hasPreviousClippingPolygons = false;
  let clippingPolygons: Cesium.ClippingPolygonCollection | null = null;
  let drawHandler: Cesium.ScreenSpaceEventHandler | null = null;
  let previewEntity: Entity | null = null;
  const previewPositions: Cesium.Cartesian3[] = [];
  let boxStart: PitPoint | null = null;
  let previousCursor = "";

  function addEntity(entity: Entity.ConstructorOptions) {
    if (!viewer) return;
    entities.push(viewer.entities.add(entity));
  }

  function clearEntities() {
    if (!viewer) {
      entities.length = 0;
      return;
    }

    entities.forEach(entity => viewer?.entities.remove(entity));
    entities.length = 0;
  }

  function setupScene(instance: Viewer) {
    const scene = instance.scene;

    scene.globe.depthTestAgainstTerrain = true;
    scene.globe.enableLighting = false;
    scene.skyAtmosphere.show = true;
    scene.fog.enabled = false;
    scene.postProcessStages.fxaa.enabled = true;

    instance.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(center.lng, center.lat, 1350),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: 1.2
    });
  }

  function applyGlobeClip() {
    if (!viewer) return;

    const globe = viewer.scene.globe;
    if (!hasPreviousClippingPolygons) {
      previousClippingPolygons = globe.clippingPolygons;
      hasPreviousClippingPolygons = true;
    }
    clippingPolygons = new Cesium.ClippingPolygonCollection({
      polygons: [
        new Cesium.ClippingPolygon({
          positions: Cesium.Cartesian3.fromDegreesArray(
            toDegreesArray(activePitPoints)
          )
        })
      ],
      inverse: false,
      quality: 1.2
    });
    globe.clippingPolygons = clippingPolygons;
  }

  function clearGlobeClip() {
    if (!viewer || !hasPreviousClippingPolygons) return;

    viewer.scene.globe.clippingPolygons = previousClippingPolygons;
    clippingPolygons = null;
  }

  function addPitSurface(depth: number) {
    addEntity({
      name: "坑口边界",
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(
          closePoints(activePitPoints).flatMap(([lng, lat]) => [lng, lat, 8])
        ),
        width: 5,
        material: Cesium.Color.fromCssColorString(earthColors.rim),
        clampToGround: false
      }
    });

    const bottomPoints = scalePitPoints(activePitPoints, 0.48);
    addEntity({
      name: "开挖底面",
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(
          toDegreesArrayHeights(bottomPoints, depth)
        ),
        perPositionHeight: true,
        material: Cesium.Color.fromCssColorString(earthColors.bottom),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(earthColors.contour)
      }
    });
  }

  function addSlopeBand(
    outer: number[][],
    inner: number[][],
    outerHeight: number,
    innerHeight: number,
    color: string
  ) {
    for (let index = 0; index < outer.length; index += 1) {
      const nextIndex = (index + 1) % outer.length;
      const [outerLng, outerLat] = outer[index];
      const [outerNextLng, outerNextLat] = outer[nextIndex];
      const [innerNextLng, innerNextLat] = inner[nextIndex];
      const [innerLng, innerLat] = inner[index];

      const heights = [
        outerLng,
        outerLat,
        outerHeight,
        outerNextLng,
        outerNextLat,
        outerHeight,
        innerNextLng,
        innerNextLat,
        innerHeight,
        innerLng,
        innerLat,
        innerHeight
      ];

      addEntity({
        name: "开挖边坡",
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(heights),
          perPositionHeight: true,
          material: Cesium.Color.fromCssColorString(color),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(earthColors.shadow)
        }
      });
    }
  }

  function addSoilTexture(depth: number) {
    const middlePoints = scalePitPoints(activePitPoints, 0.72);
    const bottomPoints = scalePitPoints(activePitPoints, 0.48);

    for (let index = 0; index < activePitPoints.length; index += 1) {
      const nextIndex = (index + 1) % activePitPoints.length;
      const [outerLng, outerLat] = activePitPoints[index];
      const [outerNextLng, outerNextLat] = activePitPoints[nextIndex];
      const [middleLng, middleLat] = middlePoints[index];
      const [middleNextLng, middleNextLat] = middlePoints[nextIndex];
      const [bottomLng, bottomLat] = bottomPoints[index];
      const [bottomNextLng, bottomNextLat] = bottomPoints[nextIndex];

      for (let step = 1; step <= 5; step += 1) {
        const rate = step / 6;
        const startLng = Cesium.Math.lerp(outerLng, middleLng, rate);
        const startLat = Cesium.Math.lerp(outerLat, middleLat, rate);
        const endLng = Cesium.Math.lerp(outerNextLng, middleNextLng, rate);
        const endLat = Cesium.Math.lerp(outerNextLat, middleNextLat, rate);
        const height = Cesium.Math.lerp(1, -depth * 0.36, rate);

        addEntity({
          name: "土层纹理",
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              startLng,
              startLat,
              height,
              endLng,
              endLat,
              height - 1.2
            ]),
            width: 1.5,
            material: Cesium.Color.fromCssColorString(earthColors.contour)
          }
        });
      }

      for (let step = 1; step <= 4; step += 1) {
        const rate = step / 5;
        const startLng = Cesium.Math.lerp(middleLng, bottomLng, rate);
        const startLat = Cesium.Math.lerp(middleLat, bottomLat, rate);
        const endLng = Cesium.Math.lerp(middleNextLng, bottomNextLng, rate);
        const endLat = Cesium.Math.lerp(middleNextLat, bottomNextLat, rate);
        const height = Cesium.Math.lerp(-depth * 0.36, -depth, rate);

        addEntity({
          name: "深层土纹",
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              startLng,
              startLat,
              height,
              endLng,
              endLat,
              height - 1.4
            ]),
            width: 1.4,
            material: Cesium.Color.fromCssColorString("#d39a73")
          }
        });
      }
    }
  }

  function addCutWalls(depth: number) {
    const middlePoints = scalePitPoints(activePitPoints, 0.72);
    const bottomPoints = scalePitPoints(activePitPoints, 0.48);

    addSlopeBand(activePitPoints, middlePoints, 2, -depth * 0.36, earthColors.upperSlope);
    addSlopeBand(middlePoints, bottomPoints, -depth * 0.36, -depth, earthColors.lowerSlope);
    addSoilTexture(depth);
  }

  function addUndergroundPipes(depth: number) {
    const pipeHeight = -depth + 8;
    const { minLng, maxLng, minLat, maxLat } = getBounds(activePitPoints);
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    const pipeGroups = [
      {
        name: "给水管线",
        color: "#d6f3ff",
        path: [
          [minLng + lngSpan * 0.18, maxLat - latSpan * 0.24],
          [minLng + lngSpan * 0.48, maxLat - latSpan * 0.48],
          [minLng + lngSpan * 0.82, minLat + latSpan * 0.28]
        ]
      },
      {
        name: "电力管廊",
        color: "#fff0a6",
        path: [
          [minLng + lngSpan * 0.18, minLat + latSpan * 0.24],
          [minLng + lngSpan * 0.5, minLat + latSpan * 0.42],
          [minLng + lngSpan * 0.84, maxLat - latSpan * 0.26]
        ]
      },
      {
        name: "通信管线",
        color: "#ffb3a6",
        path: [
          [minLng + lngSpan * 0.42, maxLat - latSpan * 0.16],
          [minLng + lngSpan * 0.48, maxLat - latSpan * 0.5],
          [minLng + lngSpan * 0.58, minLat + latSpan * 0.14]
        ]
      }
    ];

    pipeGroups.forEach(pipe => {
      const positions = pipe.path.flatMap(([lng, lat]) => [lng, lat, pipeHeight]);
      const color = Cesium.Color.fromCssColorString(pipe.color);

      addEntity({
        name: pipe.name,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
          width: 8,
          material: color
        }
      });
    });
  }

  function addDepthMarker(depth: number) {
    const { maxLng, maxLat } = getBounds(activePitPoints);
    const markerLng = maxLng + 0.00016;
    const markerLat = maxLat - 0.00008;

    addEntity({
      name: "深度标尺",
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          markerLng,
          markerLat,
          0,
          markerLng,
          markerLat,
          -depth
        ]),
        width: 4,
        material: Cesium.Color.fromCssColorString(earthColors.contour)
      },
      label: {
        text: `开挖深度 ${depth}m`,
        font: "15px sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#fff2cc"),
        outlineColor: Cesium.Color.fromCssColorString("#3a2416"),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -28),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      position: Cesium.Cartesian3.fromDegrees(markerLng, markerLat, 20)
    });
  }

  function render(depth = currentDepth) {
    currentDepth = depth;
    clearEntities();
    if (!hasPit) {
      clearGlobeClip();
      return;
    }

    applyGlobeClip();
    addPitSurface(depth);
    addCutWalls(depth);
    addUndergroundPipes(depth);
    addDepthMarker(depth);
  }

  function pickLngLat(position: Cesium.Cartesian2): PitPoint | null {
    if (!viewer) return null;

    const ray = viewer.camera.getPickRay(position);
    const globePosition = ray
      ? viewer.scene.globe.pick(ray, viewer.scene)
      : undefined;
    const cartesian =
      globePosition ??
      viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);

    if (!cartesian) return null;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude)
    ];
  }

  function setCameraInputs(enabled: boolean) {
    if (!viewer) return;

    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = enabled;
    controller.enableTranslate = enabled;
    controller.enableZoom = enabled;
    controller.enableTilt = enabled;
    controller.enableLook = enabled;
  }

  function updatePreview(points: PitPoint[]) {
    if (!viewer) return;

    previewPositions.splice(
      0,
      previewPositions.length,
      ...Cesium.Cartesian3.fromDegreesArrayHeights(
        closePoints(points).flatMap(([lng, lat]) => [lng, lat, 20])
      )
    );

    if (!previewEntity) {
      previewEntity = viewer.entities.add({
        name: "框选开挖预览",
        polyline: {
          positions: new Cesium.CallbackProperty(() => previewPositions, false),
          width: 1,
          material: Cesium.Color.fromCssColorString("#2f8cff"),
          clampToGround: false
        }
      });
    }

    viewer.scene.requestRender();
  }

  function clearPreview() {
    previewPositions.length = 0;

    if (viewer && previewEntity) {
      viewer.entities.remove(previewEntity);
    }

    previewEntity = null;
  }

  function stopBoxSelect() {
    if (viewer) {
      viewer.canvas.style.cursor = previousCursor;
    }

    drawHandler?.destroy();
    drawHandler = null;
    boxStart = null;
    clearPreview();
    setCameraInputs(true);
  }

  function startBoxSelect(onFinish?: () => void) {
    if (!viewer) return false;

    stopBoxSelect();
    setCameraInputs(false);
    previousCursor = viewer.canvas.style.cursor;
    viewer.canvas.style.cursor = "crosshair";
    drawHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    drawHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      boxStart = pickLngLat(event.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    drawHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (!boxStart) return;

      const end = pickLngLat(event.endPosition);
      if (!end) return;

      const points = createBoxPoints(boxStart, end);
      if (isValidPit(points)) {
        updatePreview(points);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    drawHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (!boxStart) {
        stopBoxSelect();
        onFinish?.();
        return;
      }

      const end = pickLngLat(event.position);
      const points = end ? createBoxPoints(boxStart, end) : null;

      stopBoxSelect();

      if (points && isValidPit(points)) {
        activePitPoints = points;
        hasPit = true;
        render(currentDepth);
      }

      onFinish?.();
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    return true;
  }

  function init(instance: Viewer) {
    viewer = instance;
    hasPit = false;
    activePitPoints = [...defaultPitPoints];
    setupScene(instance);
    clearEntities();
    clearPreview();
    clearGlobeClip();
  }

  function flyHome() {
    if (!viewer) return;
    setupScene(viewer);
  }

  function destroy(instance?: Viewer | null) {
    const target = instance ?? viewer;

    if (target) {
      entities.forEach(entity => target.entities.remove(entity));
      target.scene.globe.clippingPolygons = previousClippingPolygons;
    }

    stopBoxSelect();
    entities.length = 0;
    previewPositions.length = 0;
    previewEntity = null;
    activePitPoints = [...defaultPitPoints];
    hasPit = false;
    clippingPolygons = null;
    hasPreviousClippingPolygons = false;
    previousClippingPolygons = undefined;
    viewer = null;
  }

  return {
    init,
    render,
    startBoxSelect,
    stopBoxSelect,
    flyHome,
    destroy,
    depthOptions
  };
}
