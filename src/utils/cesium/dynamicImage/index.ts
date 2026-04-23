// 矩阵图像
import * as Cesium from "cesium";
// import {ScreenSpaceEventType} from "cesium";
import { ImageCreator } from "./ImageCreator";

interface DynamicLegend {
  legendName?: string;
  legendUnit?: string;
  legendValList: number[];
  legendColorList: string[];
  min?: number;
  max?: number;
  space?: boolean;
}

export default class dynamicImage {
  viewer;
  era5Data;
  legend;
  imageCreator;
  imgLayer;
  doc = document.getElementById("cesiumContainer"); //doc.offsetWidth页面宽度 offsetHeight页面高度

  constructor(viewer, era5Data, rect, legend: DynamicLegend) {
    // console.log("DynamicImage:", era5Data, rect, legend)
    this.viewer = viewer;
    this.era5Data = era5Data;
    this.legend = legend;
    // console.log(era5Data);
    this.init(rect);
    //
  }

  init(rect) {
    if (this.viewer) {
      const legend = this.legend;
      // console.log("color:", legend.legendColorList.reverse())
      // console.log("min max:", legend.legendValList[0], legend.legendValList[legend.legendValList.length - 1])
      // this.imageCreator = new ImageCreator({colorCreator:{
      //     max: legend.legendValList[0],
      //     min: legend.legendValList[legend.legendValList.length - 1],
      //     step: 40,
      //     colorScale: legend.legendColorList.reverse(),
      //     opacity: 1
      // }});
      // console.log("初始化图片：")
      // console.log(legend.legendColorList, legend.legendValList)
      this.imageCreator = new ImageCreator({
        // max: legend.legendValList[0],
        // min: legend.legendValList[legend.legendValList.length - 1],
        // step: 4,
        legendColor: legend.legendColorList,
        legendVal: legend.legendValList,
        opacity: 0.8
      });
      const first = this.era5Data[0];
      let maxLongitude, minLongitude, maxLatitude, minLatitude;
      if (rect) {
        maxLongitude = rect.maxLon;
        minLongitude = rect.minLon;
        maxLatitude = rect.maxLat;
        minLatitude = rect.minLat;
      } else {
        // console.log("first", first)
        maxLongitude = first[0][0]; //第一行第一列的值
        minLongitude = maxLongitude;
        maxLatitude = first[0][1];
        minLatitude = maxLatitude;
      }
      // console.log("rect", rect)
      // let datas = []
      let grids = [];
      if (!rect) {
        //找出最大最小经纬度
        for (let i = 0; i < this.era5Data.length; i++) {
          grids.push([]);
          for (let j = 0; j < this.era5Data[i].length; j++) {
            const longitude = this.era5Data[i][j][0];
            const latitude = this.era5Data[i][j][1];
            maxLongitude = Math.max(maxLongitude, longitude);
            maxLatitude = Math.max(maxLatitude, latitude);
            minLongitude = Math.min(minLongitude, longitude);
            minLatitude = Math.min(minLatitude, latitude);
            grids[i][j] = this.era5Data[i][j][2];
            // datas.push(jsonElement[2]);
          }
        }
      } else {
        grids = this.era5Data; //有传矩形范围进来，则数据是已经组装好的矩阵数据
      }
      const header = {
        lo1: minLongitude,
        lo2: maxLongitude,
        la1: minLatitude,
        la2: maxLatitude,
        dx: 0.25,
        dy: 0.25,
        nx: this.era5Data[0].length,
        ny: this.era5Data.length
      };
      this.imageCreator.setHeader(header);
      this.imageCreator.setGrids(grids);
      this.imageCreator.getImageUrl().then(url => {
        // 两种实现方式效果一致,使用下面的primitives方法导致在特定的区域会出现空白的图层,还有一个是需要开启2d渲染才能显示出来,所以选择使用第一种实现方式
        // this.imgLayer = this.viewer.imageryLayers.addImageryProvider(
        //   new Cesium.SingleTileImageryProvider({
        //     url: url,
        //     rectangle: Cesium.Rectangle.fromDegrees(
        //       minLongitude,
        //       minLatitude,
        //       maxLongitude,
        //       maxLatitude,
        //     ),
        //   }),
        // );
        // console.log("url:", url),
        this.imgLayer = this.viewer.scene.primitives.add(
          new Cesium.GroundPrimitive({
            geometryInstances: new Cesium.GeometryInstance({
              geometry: new Cesium.RectangleGeometry({
                rectangle: Cesium.Rectangle.fromDegrees(
                  minLongitude,
                  minLatitude,
                  maxLongitude,
                  maxLatitude
                ),
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
              })
            }),
            appearance: new Cesium.EllipsoidSurfaceAppearance({
              aboveGround: false,
              material: new Cesium.Material({
                fabric: {
                  type: "Image",
                  uniforms: {
                    image: url
                  }
                }
              })
            })
          })
        );
        // 地图定位到这个区间
        this.viewer.camera.flyTo({
          destination: Cesium.Rectangle.fromDegrees(
            minLongitude,
            minLatitude,
            maxLongitude,
            maxLatitude
          )
        });
        //换成 cesium的图片加载即可
        // let imageLayer = new ImageLayer({url:url,bounds:{west:minLongitude,south:minLatitude,east:maxLongitude,north:maxLatitude}});
        // imageLayer.addTo(map);
      });
    } else {
    }
  }

  getData(lon, lat) {
    for (let i = 0; i < this.era5Data.length; i++) {
      if (this.era5Data[i][0] == lon && this.era5Data[i][0] == lat) {
      }
    }
  }

  clear() {
    if (this.imgLayer && this.viewer) {
      // this.viewer.scene.primitives.remove(this.imgLayer)

      this.viewer.imageryLayers.remove(this.imgLayer);
    }
  }
}
