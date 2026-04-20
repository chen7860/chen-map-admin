import {
  Color,
  Event,
  JulianDate,
  type Material,
  type MaterialProperty,
  Property,
  type Viewer,
  type Entity
} from "cesium";

const materialType = "PureAdminPulseMaterial";
let materialRegistered = false;

class PulseMaterialProperty implements MaterialProperty {
  readonly isConstant = false;
  readonly definitionChanged = new Event();
  color: Color;
  speed: number;

  constructor(color: Color, speed: number) {
    this.color = color;
    this.speed = speed;
  }

  getType(_time: JulianDate) {
    return materialType;
  }

  getValue(_time: JulianDate, result?: Record<string, unknown>) {
    const materialResult = result ?? {};
    materialResult.color = this.color;
    materialResult.speed = this.speed;
    return materialResult;
  }

  equals(other?: Property) {
    return (
      other instanceof PulseMaterialProperty &&
      other.color.equals(this.color) &&
      other.speed === this.speed
    );
  }
}

function ensureMaterial(materialConstructor: typeof Material) {
  if (materialRegistered) return;

  (materialConstructor as typeof Material & {
    _materialCache: {
      addMaterial: (type: string, config: Record<string, unknown>) => void;
    };
  })._materialCache.addMaterial(materialType, {
    fabric: {
      type: materialType,
      uniforms: {
        color: new Color(0.25, 0.62, 1, 1),
        speed: 1
      },
      source: `
        czm_material czm_getMaterial(czm_materialInput input)
        {
          czm_material material = czm_getDefaultMaterial(input);
          vec2 st = input.st;
          float time = fract(czm_frameNumber * 0.01 * speed);
          float alpha = smoothstep(0.5, 0.0, abs(st.t - time));
          material.diffuse = color.rgb;
          material.alpha = alpha * color.a;
          return material;
        }
      `
    },
    translucent: () => true
  });

  materialRegistered = true;
}

export function useMaterial() {
  const entities: Entity[] = [];

  async function init(viewer: Viewer) {
    const { Material, Cartesian3 } = await import("cesium");
    ensureMaterial(Material);
    viewer.entities.removeAll();

    const wall = viewer.entities.add({
      name: "动态材质墙",
      wall: {
        positions: Cartesian3.fromDegreesArrayHeights([
          116.36, 39.9, 0, 116.46, 39.9, 0, 116.46, 39.82, 0, 116.36, 39.82, 0,
          116.36, 39.9, 0
        ]),
        minimumHeights: [0, 0, 0, 0, 0],
        maximumHeights: [50000, 50000, 50000, 50000, 50000],
        material: new PulseMaterialProperty(
          Color.fromCssColorString("#409eff"),
          1.5
        )
      }
    });

    const ellipse = viewer.entities.add({
      name: "脉冲圆",
      position: Cartesian3.fromDegrees(116.41, 39.86, 0),
      ellipse: {
        semiMinorAxis: 40000,
        semiMajorAxis: 40000,
        material: Color.fromCssColorString("#67c23a").withAlpha(0.35),
        outline: true,
        outlineColor: Color.fromCssColorString("#67c23a")
      }
    });

    entities.push(wall, ellipse);

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(116.41, 39.86, 180000)
    });
  }

  function destroy(viewer?: Viewer | null) {
    if (!viewer) {
      entities.length = 0;
      return;
    }

    entities.forEach(entity => viewer.entities.remove(entity));
    entities.length = 0;
  }

  return {
    init,
    destroy
  };
}
