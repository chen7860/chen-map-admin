import L from "leaflet";
import type {} from "leaflet.markercluster";

export { MarkerClusterGroup } from "./MarkerClusterGroup.js";
export { MarkerCluster } from "./MarkerCluster.js";
import "./MarkerOpacity.js";
import "./DistanceGrid.js";
import "./MarkerCluster.QuickHull.js";
import "./MarkerCluster.Spiderfier.js";
import "./MarkerClusterGroup.Refresh.js";

export function markerClusterGroup(options?: L.MarkerClusterGroupOptions) {
  return L.markerClusterGroup(options);
}
