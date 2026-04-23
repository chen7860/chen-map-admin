import type { Entity, ScreenSpaceEventHandler, Viewer } from "cesium";
import DynamicImage from "@/utils/cesium/dynamicImage/index";
import { getWeather } from "@/api/weather";

export function useDistribution() {
  const entities: Entity[] = [];
  let matrixPic: DynamicImage | null = null;
  let clickHandler: ScreenSpaceEventHandler | null = null;

  function init(viewer: Viewer) {
    getData(viewer);
  }

  async function getData(viewer: Viewer) {
    try {
      const data = await getWeather();
      addMatrixImage(data, viewer);
    } catch (error) {
      console.error("Error fetching JSON data:", error);
    }
  }

  function addMatrixImage(res: any, viewer?: Viewer) {
    if (matrixPic) {
      matrixPic.clear();
      matrixPic = null;
    }
    matrixPic = new DynamicImage(
      viewer,
      res.matrix,
      {
        minLon: res.bbox[0],
        maxLon: res.bbox[2],
        minLat: res.bbox[1],
        maxLat: res.bbox[3]
      },
      res.legend
    );
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
