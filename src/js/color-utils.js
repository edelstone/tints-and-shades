// color-utils.js - hex/RGB helpers and tint/shade generation
// Color math helpers
const pad = (number, length) => {
  let str = number.toString();
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
};

const hexToRGB = (colorValue) => ({
  red: parseInt(colorValue.substr(0, 2), 16),
  green: parseInt(colorValue.substr(2, 2), 16),
  blue: parseInt(colorValue.substr(4, 2), 16)
});

const intToHex = (rgbint) => pad(Math.min(Math.max(Math.round(rgbint), 0), 255).toString(16), 2);

const rgbToHex = (rgb) => intToHex(rgb.red) + intToHex(rgb.green) + intToHex(rgb.blue);

const DEFAULT_STEPS = 10;
const clampSteps = (steps = DEFAULT_STEPS) => {
  const parsed = parseInt(steps, 10);
  if (Number.isNaN(parsed)) return DEFAULT_STEPS;
  return Math.min(Math.max(parsed, 1), 20);
};

const mixChannel = (from, to, ratio) => from + (to - from) * ratio;

const calculateScale = (colorValue, steps, mixFn) => {
  const totalSteps = clampSteps(steps);
  const color = hexToRGB(colorValue);
  const values = [];

  for (let i = 0; i < totalSteps; i++) {
    const ratio = i / totalSteps;
    const rgb = mixFn(color, ratio);
    values.push({
      hex: rgbToHex(rgb),
      ratio,
      percent: Number((ratio * 100).toFixed(1))
    });
  }

  return values;
};

const rgbShade = (rgb, ratio) => ({
  red: mixChannel(rgb.red, 0, ratio),
  green: mixChannel(rgb.green, 0, ratio),
  blue: mixChannel(rgb.blue, 0, ratio)
});

const rgbTint = (rgb, ratio) => ({
  red: mixChannel(rgb.red, 255, ratio),
  green: mixChannel(rgb.green, 255, ratio),
  blue: mixChannel(rgb.blue, 255, ratio)
});

const calculateShades = (colorValue, steps = DEFAULT_STEPS) => calculateScale(colorValue, steps, rgbShade);
const calculateTints = (colorValue, steps = DEFAULT_STEPS) => calculateScale(colorValue, steps, rgbTint);

// Expose for reuse
window.colorUtils = {
  pad,
  hexToRGB,
  intToHex,
  rgbToHex,
  rgbShade,
  rgbTint,
  calculateScale,
  calculateShades,
  calculateTints
};
