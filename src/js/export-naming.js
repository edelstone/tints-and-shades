// export-naming.js - nearest color names (LAB) and unique slugs for palettes
// Naming helpers using color-name-list
const slugify = (value) => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-+/g, "-");

const rgbToLinear = (value) => {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const rgbToXyz = ({ red, green, blue }) => {
  const r = rgbToLinear(red);
  const g = rgbToLinear(green);
  const b = rgbToLinear(blue);

  return {
    x: (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100,
    y: (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100,
    z: (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100
  };
};

const xyzToLab = ({ x, y, z }) => {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  const fx = x / refX;
  const fy = y / refY;
  const fz = z / refZ;

  const transform = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116));

  const xr = transform(fx);
  const yr = transform(fy);
  const zr = transform(fz);

  return {
    l: (116 * yr) - 16,
    a: 500 * (xr - yr),
    b: 200 * (yr - zr)
  };
};

const hexToLab = (hex) => {
  if (!hex || hex.length !== 6) return null;
  const rgb = colorUtils.hexToRGB(hex);
  return xyzToLab(rgbToXyz(rgb));
};

let cachedColorNames = null;

const prepareColorNames = () => {
  if (cachedColorNames) return cachedColorNames;
  if (!Array.isArray(window.colorNameList)) return [];
  cachedColorNames = window.colorNameList.map((item) => {
    const hex = (item.hex || "").replace("#", "").toLowerCase();
    const lab = hexToLab(hex);
    return {
      name: slugify(item.name || ""),
      hex,
      lab
    };
  }).filter(item => item.name && item.hex && item.lab);
  return cachedColorNames;
};

const labDistance = (a, b) => {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return dl * dl + da * da + db * db;
};

const getFriendlyName = (hex, fallback) => {
  const names = prepareColorNames();
  const targetLab = hexToLab(hex);
  if (!names.length || !targetLab) return fallback;
  let closest = null;
  let minDistance = Infinity;
  for (let i = 0; i < names.length; i++) {
    const candidate = names[i];
    const distance = labDistance(targetLab, candidate.lab);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  }
  return closest ? closest.name : fallback;
};

const makeUniqueName = (name, usedNames) => {
  let finalName = name;
  let counter = 2;
  while (usedNames.has(finalName)) {
    finalName = `${name}-${counter}`;
    counter++;
  }
  usedNames.add(finalName);
  return finalName;
};

window.exportNaming = {
  slugify,
  getFriendlyName,
  makeUniqueName
};
