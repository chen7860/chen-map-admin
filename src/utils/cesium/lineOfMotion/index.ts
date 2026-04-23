import { Cartesian3, Material, HeadingPitchRange, type Entity } from "cesium";
import "./PolylineOutlineMaterial";

export default class LineOfMotion {
  viewer: any;
  entity: Entity | null = null;
  constructor(viewer: any) {
    this.viewer = viewer;
  }
  createFlowingPath(lngLatList: number[]) {
    this.entity = this.viewer.entities.add({
      polyline: {
        positions: Cartesian3.fromDegreesArray(lngLatList),
        width: 30,
        material: new Material.ImageLineMaterialProperty()
      }
    });

    // 飞向该实体并自动计算适合的缩放层级（放大），同时调整视角为“正下方（垂直俯视）”
    this.viewer.zoomTo(this.entity, new HeadingPitchRange(0, -Math.PI / 2, 0));
  }

  destroy() {
    if (this.entity && this.viewer) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
  }
}
