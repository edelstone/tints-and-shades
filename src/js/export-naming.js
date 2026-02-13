import colorUtils from "./color-utils.js";
import { colornames } from "/vendor/color-name-list/colornames.esm.js";

const slugify = (value) => value
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[’']/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-+/g, "-");

const formatLabelForDisplay = (value) => {
  if (!value || typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  if (!/^color-/i.test(normalized)) {
    return normalized;
  }
  return normalized
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

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
  if (!hex) return null;
  const normalized = hex.replace("#", "").toLowerCase();
  if (normalized.length !== 6) return null;
  const rgb = colorUtils.hexToRGB(normalized);
  return xyzToLab(rgbToXyz(rgb));
};

let cachedColorNames = null;

const prepareColorNames = () => {
  if (cachedColorNames) return cachedColorNames;
  if (!Array.isArray(colornames)) return [];

  const normalizeDisplayName = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) return "";
    return trimmed;
  };

  cachedColorNames = colornames
    .map((item) => {
      const name = normalizeDisplayName(item.name);
      const slug = slugify(name);
      const hex = (item.hex || "").replace("#", "").toLowerCase();
      const lab = hexToLab(hex);
      if (!slug || !hex || !lab) return null;
      return {
        slug,
        label: name || slug.replace(/-/g, " "),
        hex,
        lab
      };
    })
    .filter(item => item && item.slug && item.hex && item.lab);

  return cachedColorNames;
};

const labDistance = (a, b) => {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return dl * dl + da * da + db * db;
};

const createFallbackName = (fallback) => {
  const raw = (typeof fallback === "string" ? fallback.trim() : "") || "color";
  const slug = slugify(raw) || slugify("color");
  return {
    slug,
    label: raw || slug
  };
};

const getFriendlyName = (hex, fallback) => {
  const names = prepareColorNames();
  const targetLab = hexToLab(hex);
  if (!names.length || !targetLab) return createFallbackName(fallback);

  let closest = null;
  let minDistance = Infinity;

  for (const candidate of names) {
    const distance = labDistance(targetLab, candidate.lab);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  }

  if (!closest) return createFallbackName(fallback);

  return {
    slug: closest.slug,
    label: closest.label || closest.slug
  };
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

const exportNaming = {
  slugify,
  getFriendlyName,
  makeUniqueName,
  formatLabelForDisplay
};

export { slugify, getFriendlyName, makeUniqueName, formatLabelForDisplay };
export default exportNaming;
