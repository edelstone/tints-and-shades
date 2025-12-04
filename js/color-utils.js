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

const rgbShade = (rgb, i) => ({
  red: rgb.red * (1 - 0.1 * i),
  green: rgb.green * (1 - 0.1 * i),
  blue: rgb.blue * (1 - 0.1 * i)
});

const rgbTint = (rgb, i) => ({
  red: rgb.red + (255 - rgb.red) * i * 0.1,
  green: rgb.green + (255 - rgb.green) * i * 0.1,
  blue: rgb.blue + (255 - rgb.blue) * i * 0.1
});

const calculate = (colorValue, shadeOrTint) => {
  const color = hexToRGB(colorValue);
  const shadeValues = [];

  for (let i = 0; i < 10; i++) {
    shadeValues[i] = rgbToHex(shadeOrTint(color, i));
  }
  return shadeValues;
};

const calculateShades = (colorValue) => calculate(colorValue, rgbShade).concat("000000");
const calculateTints = (colorValue) => calculate(colorValue, rgbTint).concat("ffffff");

// Expose for reuse
window.colorUtils = {
  pad,
  hexToRGB,
  intToHex,
  rgbToHex,
  rgbShade,
  rgbTint,
  calculate,
  calculateShades,
  calculateTints
};
