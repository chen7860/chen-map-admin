// import {Viewer} from "cesium";

const bilinearInterpolateVector = function (x, y, g00, g10, g01, g11) {
  const rx = 1 - x;
  const ry = 1 - y;
  const a = rx * ry,
    b = x * ry,
    c = rx * y,
    d = x * y;
  const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
  const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
  return [u, v, Math.sqrt(u * u + v * v)];
};

import ColorCreator from "./ColorCreator";

export class ImageCreator {
  private options: any = {
    title: "海面风场",
    name: "风速",
    hasPopup: true,
    colorCreator: null
  };
  unit = "";
  private _colorCreator?: ColorCreator;
  private _viewer?: Cesium.Viewer;
  private needBuild = true;
  private data: any;
  private _canvas?: HTMLCanvasElement;
  private nx: number;
  private ny: number;
  private grid: any[];
  private lngStart: number;
  private dx: number;
  private dy: number;
  private latStart: number;
  private legendColor: any[];
  private legendVal: any[];
  private opacity: number;

  constructor(options: {}) {
    // this.setOptions(options)
    this.legendVal = options.legendVal;
    this.legendColor = options.legendColor;
    this.opacity = options.opacity;
  }

  setOptions(options) {
    // if (options) {
    this.options = Object.assign(this.options, options);
    this._colorCreator = new ColorCreator(this.options.colorCreator);
    // this._colorCreator = this.options.colorCreator;
    this.unit = this.options.colorCreator ? this.options.colorCreator.unit : "";
    // }
  }

  setHeader(header) {
    this.lngStart = header.lo1;
    this.latStart = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)

    this.dx = header.dx;
    this.dy = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

    this.nx = header.nx;
    this.ny = header.ny;
  }

  addTo(viewer) {
    this._viewer = viewer;
    this._createCanvas(this._viewer.container);
  }

  setData(data) {
    this.needBuild = true;
    this.data = data;
    // this.buildGrid(data)
  }

  setGrids(grids: Array<any>) {
    this.grid = grids;
    this.needBuild = false;
  }

  clearPopup() {
    this._viewer.closePopup();
  }

  reload() {
    this._createCanvas(this._viewer.container);
  }

  _createCanvas() {
    if (!this._canvas) {
      this._canvas = document.createElement("canvas");
      // this._canvas.style.visibility = 'invisible'
      // container.appendChild(this._canvas)
      // if (this.options.hasPopup) {
      //   this._viewer.on('click', this._onMouseClick, this)
      // }
    }
  }

  _removeCanvas(container) {
    if (this._canvas && this._canvas.parentNode === container) {
      // container.removeChild(this._canvas)
      this._canvas = null;
    }
  }

  buildGrid(data) {
    // let builder = data.data
    const builder = data;
    const header = builder.header;

    const datas = builder.data;

    this.lngStart = header.lo1;
    this.latStart = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)

    this.dx = header.dx;
    this.dy = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

    const ni = header.nx;
    const nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)

    this.nx = ni;
    this.ny = nj;
    // this.date = new Date(header.refTime);
    // this.date.setHours(this.date.getHours() + header.forecastTime);

    const grid = [];
    let p = 0;
    const isContinuous = Math.floor(ni * this.dx) >= 360;
    for (let j = 0; j < nj; j++) {
      const row = [];
      for (let i = 0; i < ni; i++, p++) {
        row[i] = datas[p];
      }
      if (isContinuous) {
        row.push(row[0]);
      }
      grid[j] = row;
    }
    this.grid = grid;
  }

  interpolate(lng: number, lat: number) {
    const i = this.floorMod(lng - this.lngStart, 360) / this.dx; // calculate latitude index in wrapped [0,360)
    const j = (lat - this.latStart) / this.dy; // calculate latitude index in direction +90 to -90
    const fi = Math.floor(i);
    const fj = Math.floor(j);
    let row;
    if ((row = this.grid[fj])) {
      const g00 = row[fi];
      if (this.isValue(g00)) {
        return g00;
      }
      // let g10 = row[ci];
      // if (this.isValue(g00) && this.isValue(g10) && (row = this.grid[cj])) {
      //     let g01 = row[fi];
      //     let g11 = row[ci];
      //     if (this.isValue(g01) && this.isValue(g11)) {
      //         return bilinearInterpolateVector(i - fi, j - fj, g00, g10, g01, g11);
      //     }
      // }
    }
    return null;
  }

  // //判断经纬度坐标是否在范围内，如果在，返回对应grid行列所在的数据下标(grid是按照一列一列读取的)
  // getDataByLonLat(lng:number, lat:number) {
  //   // console.log("getDataByLonLat", lng, lat)
  //   // // let i = this.floorMod(lng - this.lngStart, 360) / this.dx;  // calculate latitude index in direction +180 to -180
  //   // let i = (lng - this.lngStart) / this.dx                 // calculate latitude index in direction +180 to -180
  //   // let j = (lat -this.latStart) / this.dy;                 // calculate latitude index in direction +90 to -90
  //   // // let fi = Math.floor(i), ci = fi + 1;
  //   // // let fj = Math.floor(j), cj = fj + 1;
  //   // let fi = Number(i.toFixed(0)), ci = fi + 1;
  //   // let fj = Number(j.toFixed(0)), cj = fj + 1;
  //   // let fi = -1, fj = -1
  //   for (let i = 0; i < this.grid.length; i++) {
  //     //先判断纬度，同一行数据的纬度一样
  //     if(this.grid[i][0][1] - 0.125 <= lat && lat <= this.grid[i][0][1]) {
  //       for (let j = 0; j < this.grid[i].length; j++) {
  //         //经纬度在某个格点的-0.125 ~ +0.125之间
  //         if(this.grid[i][j][0] - 0.125 <= lng && lng <= this.grid[i][j][0] + 0.125) {
  //           return this.grid[i][j]
  //         }
  //       }
  //     }
  //   }
  //   // console.log(typeof fi)
  //   // let row;
  //   // if ((row = this.grid[fj])) {
  //   //   let g00 = row[fi][2];
  //   //   if (this.isValue(g00)) {
  //   //     console.log("lonLat:", lng, lat, this.lngStart, this.latStart, fj, fi, this.ny)
  //   //     // return {row: fj, col: fi, ny: this.ny};
  //   //     return row[fi]
  //   //   }
  //   // }
  //   return null;
  // }

  floorMod(a, n) {
    return a - n * Math.floor(a / n);
  }

  interpolateValue(x, y) {
    const fi = x,
      ci = x + 1;
    const fj = y,
      cj = y + 1;
    let row;
    if ((row = this.grid[fj])) {
      const g00 = row[fi];
      const g10 = row[ci];
      if (this.isValue(g00) && this.isValue(g10) && (row = this.grid[cj])) {
        const g01 = row[fi];
        const g11 = row[ci];
        if (this.isValue(g01) && this.isValue(g11)) {
          return bilinearInterpolateVector(0, 0, g00, g10, g01, g11);
        }
      }
    }
    return 0;
  }

  /**
   * @returns {Boolean} true if the specified value is not null and not undefined.
   */
  isValue(x: number) {
    return x !== null && x !== undefined;
  }

  drawImage(columns: any[]) {
    const canvas = this._canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, 3000, 3000);
    const height = columns.length;
    const width = columns[0].length;
    canvas.height = height;
    canvas.width = width;
    const imagedata = ctx.getImageData(0, 0, width, height);
    const datas = imagedata.data;
    let pos = 0;
    // let colorCreator = this._colorCreator
    for (let i = 0; i < height; i++) {
      const column = columns[i];
      for (let j = 0; j < width; j++) {
        const columnElement = column[j];
        // if (columnElement === null) {
        //     // columnElement=this.interplate(column,j)
        //     columnElement = this.interpolateValue(j, i)
        //     // let value=10;
        // }
        if (columnElement !== null) {
          // let rgba = colorCreator.getColor(columnElement);
          const color = this.getColor(columnElement);
          const rgba = this.colorRgba(color, this.opacity);
          // console.log("rgba:", rgba)
          if (rgba) {
            datas[pos] = rgba[0];
            datas[pos + 1] = rgba[1];
            datas[pos + 2] = rgba[2];
            datas[pos + 3] = rgba[3];
          }
        }
        pos = pos + 4;
      }
    }

    ctx.putImageData(imagedata, 0, 0);
  }

  getColor(val) {
    val = Number(val);
    const valArr = this.legendVal;
    const len = valArr.length;
    let color = "";
    if (len) {
      for (let i = 0; i < len; i++) {
        if (val >= valArr[i]) {
          color = this.legendColor[i];
          break;
        }
      }
      if (!color) {
        // 超过下限值用 >= 无法判断，导致color未空，用 <= 判断
        for (let i = 0; i < len; i++) {
          if (val <= valArr[i]) {
            color = this.legendColor[i];
          }
        }
      }
    } else {
      return false;
    }
    // console.log("getColor", val, color)
    return color;
  }

  //十六进制颜色值转成rgb
  colorRgba(val, opacity) {
    // 16进制颜色值的正则
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    // 把颜色值变成小写
    let color = val.toLowerCase();
    if (reg.test(color)) {
      // 如果只有三位的值，需变成六位，如：#fff => #ffffff
      if (color.length === 4) {
        let colorNew = "#";
        for (let i = 1; i < 4; i += 1) {
          colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1));
        }
        color = colorNew;
      }
      // 处理六位的颜色值，转为RGB
      const colorChange = [];
      for (let i = 1; i < 7; i += 2) {
        colorChange.push(parseInt("0x" + color.slice(i, i + 2)));
      }
      colorChange.push(opacity * 255);
      return colorChange;
    } else {
      return color;
    }
  }

  getBound() {
    const latEnd = this.latStart - (this.ny - 1) * this.dy;
    const lngEnd = this.lngStart + (this.nx - 1) * this.dx;
    return [
      [this.lngStart, latEnd],
      [lngEnd, this.latStart]
    ];
  }

  getContent(latLng: any) {
    if (!latLng) {
      return null;
    }
    const value = this.interpolate(latLng.lng, latLng.lat);
    if (value !== null) {
      const data = this.options.formatter
        ? this.options.formatter(value)
        : value.toFixed(2);
      return (
        "<li>" +
        this.options.name +
        "：" +
        data +
        this.unit +
        "</li><li>经度：" +
        latLng.lng.toFixed(2) +
        "</li><li>纬度：" +
        latLng.lat.toFixed(2) +
        "</li>"
      );
    } else {
      return null;
    }
  }

  getImageUrl() {
    return new Promise(resolve => {
      if (this.needBuild) {
        this.buildGrid(this.data);
      }
      try {
        this.drawImage(this.grid);
      } catch (err) {
        // this._removeCanvas(this._viewer.container)
        this._createCanvas();
        this.drawImage(this.grid);
      }
      // let img = document.getElementById("testImage");
      // img.src=this._canvas.toDataURL();
      resolve(this._canvas.toDataURL());
      // resolve("http://192.168.1.23:88/asdfasd.png")
    });
  }

  destroy() {
    this._removeCanvas(this._viewer.container);
    this._viewer.off("click", this._onMouseClick, this);
    this.clearPopup();
  }

  _onMouseClick(e) {
    const content = this.getContent(e.latLng);
    if (content !== null) {
      this._viewer.openPopup(this.options.title, content, e.earthPosition, {});
    } else {
      this._viewer.closePopup();
    }
  }
}

// export class WindyImageCreator extends ImageCreator {

//   createWindBuilder(uComp, vComp) {
//     var uData = uComp.data, vData = vComp.data;
//     return {
//       header: uComp.header,
//       //recipe: recipeFor("wind-" + uComp.header.surface1Value),
//       data: function (i) {
//         return [uData[i], vData[i]];
//       },
//       interpolate: bilinearInterpolateVector
//     }
//   };

//   createBuilder(data) {
//     var uComp = null, vComp = null, scalar = null;

//     data.forEach(function (record) {
//       switch (record.header.parameterCategory + "," + record.header.parameterNumber) {
//         case "2,2":
//           uComp = record;
//           break;
//         case "2,3":
//           vComp = record;
//           break;
//         default:
//           scalar = record;
//       }
//     });

//     return this.createWindBuilder(uComp, vComp);
//   };

//   buildGrid(data) {
//     let builder = this.createBuilder(data);
//     var header = builder.header;

//     let datas = builder.data

//     this.lngStart = header.lo1;
//     this.latStart = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)

//     this.dx = header.dx;
//     this.dy = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

//     let ni = header.nx;
//     let nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)

//     this.nx = ni;
//     this.ny = nj;
//     this.date = new Date(header.refTime);
//     this.date.setHours(this.date.getHours() + header.forecastTime);
//     let grid = [];
//     let p = 0;
//     let isContinuous = Math.floor(ni * this.dx) >= 360;
//     for (let j = 0; j < nj; j++) {
//       let row = [];
//       for (let i = 0; i < ni; i++, p++) {
//         row[i] = this.vectorToDegrees(datas(p));
//       }
//       if (isContinuous) {
//         row.push(row[0]);
//       }
//       grid[j] = row;
//     }
//     this.grid = grid;
//   }

//   drawImage(columns) {
//     let canvas = this._canvas
//     let ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, 3000, 3000)
//     let height = columns.length;
//     let width = columns[0].length;
//     canvas.height = height;
//     canvas.width = width;
//     var imagedata = ctx.getImageData(0, 0, width, height);
//     let datas = imagedata.data;
//     let pos = 0;
//     let colorCreator = this._colorCreator
//     for (let i = 0; i < height; i++) {
//       let column = columns[i];
//       for (let j = 0; j < width; j++) {
//         let columnElement = this.getData(column[j]);
//         if (columnElement !== null) {
//           let rgba = colorCreator.getColor(columnElement);
//           if (rgba) {
//             datas[pos] = rgba[0];
//             datas[pos + 1] = rgba[1];
//             datas[pos + 2] = rgba[2];
//             datas[pos + 3] = rgba[3];
//           }
//         }
//         pos = pos + 4;
//       }
//     }
//     ctx.putImageData(imagedata, 0, 0)
//     //在绘制结束的时候重新开启结束一个绘制，之前的线条黑色就会消失；
//   }

//   getData(column) {
//     if (column != null) {
//       return column[0]
//     }
//     return null;
//   }

//   getValue(column) {
//     let u = column[0]
//     let v = column[1]
//     if (!this.isValue(v) || !this.isValue(u)) {
//       return null
//     }
//     return Math.sqrt(Math.pow(u, 2) + Math.pow(v, 2));
//   }

//   isValue(x) {
//     return x !== null && x !== undefined;
//   }

//   getContent(latLng) {
//     if (!latLng) {
//       return null
//     }
//     let value = this.interpolate(latLng.lng, latLng.lat);
//     if (value !== null) {
//       return '<li>' + this.options.name + '：' + value[0].toFixed(2) + this.unit +
//         '</li><li>方向：' + value[1].toFixed(2) +
//         '</li><li>经度：' + latLng.lng.toFixed(2) +
//         '</li><li>纬度：' + latLng.lat.toFixed(2) +
//         '</li>';
//     } else {
//       return null;
//     }
//   }

//   vectorToDegrees(column, angleConvention = 'meteoCCW') {
//     if (column == null || column.length < 2) {
//       return null;
//     }
//     let uMs = column[0]
//     let vMs = column[1]
//     if (!this.isValue(vMs) || !this.isValue(uMs)) {
//       return null
//     }
//     // Default angle convention is CW
//     if (angleConvention.endsWith('CCW')) {
//       // vMs comes out upside-down..
//       vMs = vMs > 0 ? vMs = -vMs : Math.abs(vMs);
//     }
//     var velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));

//     var velocityDir = Math.atan2(uMs / velocityAbs, vMs / velocityAbs);
//     var velocityDirToDegrees = velocityDir * 180 / Math.PI + 180;

//     if (angleConvention === 'bearingCW' || angleConvention === 'meteoCCW') {
//       velocityDirToDegrees += 180;
//       if (velocityDirToDegrees >= 360) velocityDirToDegrees -= 360;
//     }

//     return [Math.abs(velocityAbs), velocityDirToDegrees];
//   }
// }
