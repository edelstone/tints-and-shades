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

const rgbToHsl = (rgb) => {
  const r = rgb.red / 255;
  const g = rgb.green / 255;
  const b = rgb.blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        hue = ((b - r) / delta + 2) * 60;
        break;
      default:
        hue = ((r - g) / delta + 4) * 60;
    }
  }

  return {
    hue: (hue + 360) % 360,
    saturation,
    lightness
  };
};

const hueToRgb = (p, q, t) => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

const hslToRgb = ({ hue, saturation, lightness }) => {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = Math.min(Math.max(saturation, 0), 1);
  const l = Math.min(Math.max(lightness, 0), 1);

  if (s === 0) {
    const value = Math.round(l * 255);
    return { red: value, green: value, blue: value };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    red: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    green: Math.round(hueToRgb(p, q, h) * 255),
    blue: Math.round(hueToRgb(p, q, h - 1 / 3) * 255)
  };
};

const calculateComplementaryHex = (colorValue) => {
  if (typeof colorValue !== "string") return null;
  const normalized = colorValue.replace(/^#/, "").trim().toLowerCase();
  if (normalized.length !== 6) return null;
  const rgb = hexToRGB(normalized);
  const hsl = rgbToHsl(rgb);
  const complementHue = (hsl.hue + 180) % 360;
  const complementaryRgb = hslToRgb({ hue: complementHue, saturation: hsl.saturation, lightness: hsl.lightness });
  return rgbToHex(complementaryRgb);
};

// Expose for reuse
window.colorUtils = {
  pad,
  hexToRGB,
  intToHex,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbShade,
  rgbTint,
  calculateScale,
  calculateShades,
  calculateTints,
  calculateComplementaryHex
};
