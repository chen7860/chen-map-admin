export default class ColorCreator {
  gradientColors = [];
  unitValue = 0.16;
  isRange = false;
  options = {
    max: 40,
    min: 0,
    step: 40,
    opacity: 1,
    colorScale: [
      "#2966a3",
      "#358ca9",
      "#4A9194",
      "#4D8D7C",
      "#4CA44C",
      "#66A335",
      "#A1873F",
      "#A16C5B",
      "#8C3F5B",
      "#974B90"
    ],
    valueRange: [],
    mode: "average" //range
    // mode: 'range',//range
  };
  private alpha: number;

  constructor(options) {
    this.options = Object.assign(this.options, options);
    this.isRange = this.options.mode === "range";
    this.alpha = this.options.opacity * 255;
    if (this.isRange) {
      this.createRangeGradientColorArray();
    } else {
      this.createGradientColorArray();
    }
  }

  isValue(x) {
    return x !== null && x !== undefined;
  }

  getColor(value) {
    if (this.isValue(value)) {
      if (this.isRange) {
        return this.getRangeColor(value);
      }
      return this.getNormalColor(value);
    }
  }

  getNormalColor(value) {
    // console.log("getNormalColor:", value)
    const index = Math.round((value - this.options.min) / this.unitValue);
    const length = this.gradientColors.length - 1;
    if (index > length) {
      return this.gradientColors[length];
    }
    if (index < 0) {
      return this.gradientColors[0];
    }
    return this.gradientColors[index];
  }

  getRangeColor(value) {
    const valueRange = this.options.valueRange;
    let index = valueRange.length - 2;
    let start = valueRange[valueRange.length - 2];
    for (let i = 1; i < valueRange.length; i++) {
      if (value < valueRange[i]) {
        index = i - 1;
        start = valueRange[index];
        break;
      }
    }
    const i = Math.round((value - start) / this.unitValue[index]);
    const gradientColor = this.gradientColors[index];
    const length = gradientColor.length - 1;
    if (i > length) {
      return gradientColor[length];
    }
    if (i < 0) {
      return gradientColor[0];
    }
    const gradientColorElement = gradientColor[i];
    return gradientColorElement;
  }

  createRangeGradientColorArray() {
    const COLOR_STEP = this.options.step;
    const colorScale = this.options.colorScale;
    const valueRange = this.options.valueRange;
    const start = valueRange[0];
    this.unitValue = [];
    for (let i = 1; i < valueRange.length; i++) {
      const total = valueRange[i] - start;
      this.unitValue.push(total / COLOR_STEP);
      const rangeGradientColor = this._getRangeGradientColor(
        colorScale[i - 1],
        colorScale[i],
        COLOR_STEP
      );
      this.gradientColors.push(rangeGradientColor);
    }
  }

  createGradientColorArray() {
    const COLOR_STEP = this.options.step;
    const colorScale = this.options.colorScale;
    const total = Math.floor(this.options.max - this.options.min);
    this.unitValue = total / ((colorScale.length - 1) * COLOR_STEP);
    for (let i = 0; i < colorScale.length - 1; i++) {
      this._getGradientColor(colorScale[i], colorScale[i + 1], COLOR_STEP);
    }
  }

  _getRangeGradientColor(start, end, steps, gamma) {
    let i, j, ms, me;
    gamma = gamma || 1;
    const normalize = function (channel) {
      return Math.pow(channel / 255, gamma);
    };
    start = this.parseColor(start).map(normalize);
    end = this.parseColor(end).map(normalize);
    const alpha = this.alpha;
    const gradientColors = [];
    for (i = 0; i < steps; i++) {
      ms = i / (steps - 1);
      me = 1 - ms;
      const output = [];
      for (j = 0; j < 3; j++) {
        const color = Math.round(
          Math.pow(start[j] * me + end[j] * ms, 1 / gamma) * 255
        );
        output.push(color);
      }
      output.push(alpha);
      gradientColors.push(output);
    }
    return gradientColors;
  }

  _getGradientColor(start: number, end: number, steps: number, gamma: number) {
    let i, j, ms, me;
    gamma = gamma || 1;
    const normalize = function (channel: number) {
      return Math.pow(channel / 255, gamma);
    };
    start = this.parseColor(start).map(normalize);
    end = this.parseColor(end).map(normalize);
    const alpha = this.alpha;
    for (i = 0; i < steps; i++) {
      ms = i / (steps - 1);
      me = 1 - ms;
      const output = [];
      for (j = 0; j < 3; j++) {
        const color = Math.round(
          Math.pow(start[j] * me + end[j] * ms, 1 / gamma) * 255
        );
        output.push(color);
      }
      output.push(alpha);
      this.gradientColors.push(output);
    }
  }

  parseColor(hexStr: string) {
    return hexStr.length === 4
      ? hexStr
          .substr(1)
          .split("")
          .map(function (s) {
            return 0x11 * parseInt(s, 16);
          })
      : [hexStr.substr(1, 2), hexStr.substr(3, 2), hexStr.substr(5, 2)].map(
          function (s) {
            return parseInt(s, 16);
          }
        );
  }
}
