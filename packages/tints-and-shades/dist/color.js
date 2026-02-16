const HEX_3_RE = /^[0-9a-fA-F]{3}$/;
const HEX_6_RE = /^[0-9a-fA-F]{6}$/;
const clampChannel = (value) => Math.min(Math.max(Math.round(value), 0), 255);
const toChannelHex = (value) => clampChannel(value).toString(16).padStart(2, "0");
const normalizeHue = (value) => ((value % 360) + 360) % 360;
const assertNormalizedHex = (value) => {
    const normalized = normalizeHex(value);
    if (!normalized) {
        throw new TypeError("colorValue must be a valid 3- or 6-character hex string with optional '#'.");
    }
    return normalized;
};
export const normalizeHex = (value) => {
    if (typeof value !== "string")
        return null;
    const stripped = value.trim().replace(/^#/, "").toLowerCase();
    if (HEX_6_RE.test(stripped))
        return stripped;
    if (HEX_3_RE.test(stripped)) {
        return stripped.split("").map((char) => char + char).join("");
    }
    return null;
};
export const hexToRgb = (colorValue) => {
    const normalized = assertNormalizedHex(colorValue);
    return {
        red: parseInt(normalized.slice(0, 2), 16),
        green: parseInt(normalized.slice(2, 4), 16),
        blue: parseInt(normalized.slice(4, 6), 16)
    };
};
export const rgbToHex = (rgb) => toChannelHex(rgb.red) + toChannelHex(rgb.green) + toChannelHex(rgb.blue);
export const rgbToHsl = (rgb) => {
    const r = clampChannel(rgb.red) / 255;
    const g = clampChannel(rgb.green) / 255;
    const b = clampChannel(rgb.blue) / 255;
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
                break;
        }
    }
    return {
        hue: normalizeHue(hue),
        saturation,
        lightness
    };
};
const hueToRgb = (p, q, t) => {
    let channel = t;
    if (channel < 0)
        channel += 1;
    if (channel > 1)
        channel -= 1;
    if (channel < 1 / 6)
        return p + (q - p) * 6 * channel;
    if (channel < 1 / 2)
        return q;
    if (channel < 2 / 3)
        return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
};
export const hslToRgb = ({ hue, saturation, lightness }) => {
    const h = normalizeHue(hue) / 360;
    const s = Math.min(Math.max(saturation, 0), 1);
    const l = Math.min(Math.max(lightness, 0), 1);
    if (s === 0) {
        const value = clampChannel(l * 255);
        return { red: value, green: value, blue: value };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        red: clampChannel(hueToRgb(p, q, h + 1 / 3) * 255),
        green: clampChannel(hueToRgb(p, q, h) * 255),
        blue: clampChannel(hueToRgb(p, q, h - 1 / 3) * 255)
    };
};
const rotateHueHexes = (colorValue, offsets) => {
    const normalized = assertNormalizedHex(colorValue);
    const baseHsl = rgbToHsl(hexToRgb(normalized));
    return offsets.map((offset) => {
        const rgb = hslToRgb({
            hue: normalizeHue(baseHsl.hue + offset),
            saturation: baseHsl.saturation,
            lightness: baseHsl.lightness
        });
        return rgbToHex(rgb);
    });
};
export const getComplementaryHex = (colorValue) => rotateHueHexes(colorValue, [180])[0];
export const getSplitComplementaryHexes = (colorValue) => rotateHueHexes(colorValue, [150, 210]);
export const getAnalogousHexes = (colorValue) => rotateHueHexes(colorValue, [-30, 30]);
export const getTriadicHexes = (colorValue) => rotateHueHexes(colorValue, [120, 240]);
