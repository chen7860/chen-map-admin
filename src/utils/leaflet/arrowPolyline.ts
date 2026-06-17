import L from "leaflet";

export interface ArrowPathOptions {
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
  arrow?: {
    size?: number;
    color?: string;
    showAtEnd?: boolean;
  };
  animation?: {
    enabled?: boolean;
    speed?: number;
  };
}

interface ResolvedArrowPathOptions {
  color: string;
  weight: number;
  opacity: number;
  dashArray: string;
  arrow: {
    size: number;
    color: string;
    showAtEnd: boolean;
  };
  animation: {
    enabled: boolean;
    speed: number;
  };
}

export class ArrowPathManager {
  private map: L.Map;
  private pathLayer: L.Polyline | null = null;
  private arrowsLayer: L.LayerGroup | null = null;
  private animationLayer: L.LayerGroup | null = null;
  private options: ResolvedArrowPathOptions;
  private coordinates: [number, number][] = [];
  private baseArrowSize = 5;
  private animationFrames: number[] = [];
  private animationTimers: number[] = [];
  private zoomEventHandler: () => void;

  constructor(map: L.Map) {
    this.map = map;
    this.options = {
      color: "#e74c3c",
      weight: 3,
      opacity: 0.8,
      dashArray: "",
      arrow: {
        size: 5,
        color: "#e74c3c",
        showAtEnd: true
      },
      animation: {
        enabled: true,
        speed: 2000
      }
    };

    this.zoomEventHandler = () => this.onZoomChange();
    this.map.on("zoomend", this.zoomEventHandler);
  }

  addArrowPath(
    coordinates: [number, number][],
    options: ArrowPathOptions = {}
  ): void {
    this.coordinates = coordinates;
    this.options = {
      ...this.options,
      ...options,
      arrow: { ...this.options.arrow, ...options.arrow },
      animation: { ...this.options.animation, ...options.animation }
    };
    this.baseArrowSize = this.options.arrow.size;

    if (!options.arrow?.color) {
      this.options.arrow.color = this.options.color;
    }

    const latlngs = coordinates.map(coord => L.latLng(coord[1], coord[0]));

    this.clear();
    this.createPath(latlngs);
    this.createArrows(latlngs);

    if (this.options.animation.enabled) {
      this.createAnimation(latlngs);
    }
  }

  clear(): void {
    this.clearAnimationHandles();

    if (this.pathLayer) {
      this.map.removeLayer(this.pathLayer);
      this.pathLayer = null;
    }

    if (this.arrowsLayer) {
      this.map.removeLayer(this.arrowsLayer);
      this.arrowsLayer = null;
    }

    if (this.animationLayer) {
      this.map.removeLayer(this.animationLayer);
      this.animationLayer = null;
    }
  }

  destroy(): void {
    this.map.off("zoomend", this.zoomEventHandler);
    this.clear();
  }

  private onZoomChange(): void {
    if (!this.coordinates.length) return;

    const latlngs = this.coordinates.map(coord => L.latLng(coord[1], coord[0]));

    if (this.arrowsLayer) {
      this.map.removeLayer(this.arrowsLayer);
      this.arrowsLayer = null;
    }

    this.createArrows(latlngs);
  }

  private getAdaptiveArrowSize(): number {
    const zoomFactor = Math.pow(0.9, this.map.getZoom() - 10);
    const scale = Math.max(0.6, Math.min(1.8, zoomFactor));

    return this.baseArrowSize * scale;
  }

  private createPath(latlngs: L.LatLng[]): void {
    this.pathLayer = L.polyline(latlngs, {
      color: this.options.color,
      weight: this.options.weight,
      opacity: this.options.opacity,
      dashArray: this.options.dashArray
    }).addTo(this.map);
  }

  private createArrows(latlngs: L.LatLng[]): void {
    if (!this.options.arrow.showAtEnd || latlngs.length < 2) return;

    this.arrowsLayer = L.layerGroup().addTo(this.map);

    const secondLast = latlngs[latlngs.length - 2];
    const last = latlngs[latlngs.length - 1];
    const angle = this.calculateAngle(secondLast, last);

    this.createArrowMarker(last, angle, this.getAdaptiveArrowSize());
  }

  private createArrowMarker(
    latlng: L.LatLng,
    angle: number,
    size?: number
  ): void {
    if (!this.arrowsLayer) return;

    const arrowPoints = this.getArrowPoints(
      latlng,
      angle,
      size || this.options.arrow.size
    );

    const arrow = L.polygon(arrowPoints, {
      color: this.options.arrow.color,
      fillColor: this.options.arrow.color,
      fillOpacity: 1,
      weight: 1,
      interactive: false
    });

    this.arrowsLayer.addLayer(arrow);
  }

  private getArrowPoints(
    center: L.LatLng,
    angle: number,
    size: number
  ): L.LatLng[] {
    const centerPixel = this.map.latLngToContainerPoint(center);
    const angleRad = (angle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const tip = L.point(centerPixel.x + size * cos, centerPixel.y + size * sin);
    const left = L.point(
      centerPixel.x - size * 0.6 * cos + size * 0.4 * sin,
      centerPixel.y - size * 0.6 * sin - size * 0.4 * cos
    );
    const right = L.point(
      centerPixel.x - size * 0.6 * cos - size * 0.4 * sin,
      centerPixel.y - size * 0.6 * sin + size * 0.4 * cos
    );

    return [
      this.map.containerPointToLatLng(tip),
      this.map.containerPointToLatLng(left),
      this.map.containerPointToLatLng(right)
    ];
  }

  private calculateAngle(start: L.LatLng, end: L.LatLng): number {
    const startPixel = this.map.latLngToContainerPoint(start);
    const endPixel = this.map.latLngToContainerPoint(end);

    return (
      (Math.atan2(endPixel.y - startPixel.y, endPixel.x - startPixel.x) * 180) /
      Math.PI
    );
  }

  private interpolateLatLng(
    start: L.LatLng,
    end: L.LatLng,
    ratio: number
  ): L.LatLng {
    return L.latLng(
      start.lat + (end.lat - start.lat) * ratio,
      start.lng + (end.lng - start.lng) * ratio
    );
  }

  private createAnimation(latlngs: L.LatLng[]): void {
    this.animationLayer = L.layerGroup().addTo(this.map);

    for (let index = 0; index < latlngs.length - 1; index += 1) {
      this.createFlowingDot(latlngs[index], latlngs[index + 1]);
    }
  }

  private createFlowingDot(start: L.LatLng, end: L.LatLng): void {
    if (!this.animationLayer) return;

    const dot = L.circleMarker(start, {
      radius: 4,
      color: this.options.color,
      fillColor: "#ffffff",
      fillOpacity: 1,
      weight: 2,
      interactive: false
    });

    this.animationLayer.addLayer(dot);

    const animateDot = () => {
      const distance = start.distanceTo(end);
      const duration = Math.max(
        500,
        this.options.animation.speed * (distance / 1000)
      );
      const startTime = Date.now();

      const animate = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);

        dot.setLatLng(this.interpolateLatLng(start, end, progress));

        if (progress < 1) {
          this.animationFrames.push(requestAnimationFrame(animate));
          return;
        }

        this.animationTimers.push(window.setTimeout(animateDot, 500));
      };

      animate();
    };

    this.animationTimers.push(
      window.setTimeout(animateDot, Math.random() * 1000)
    );
  }

  private clearAnimationHandles(): void {
    this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
    this.animationFrames = [];
    this.animationTimers.forEach(timer => window.clearTimeout(timer));
    this.animationTimers = [];
  }
}

export function addArrowPath(
  map: L.Map,
  coordinates: [number, number][],
  options: ArrowPathOptions = {}
): ArrowPathManager {
  const manager = new ArrowPathManager(map);
  manager.addArrowPath(coordinates, options);
  return manager;
}
