const pad = (number, length) => {
    let str = number.toString();
    while (str.length < length) {
        str = "0" + str;
    }
    return str;
};
const hexToRGB = (colorValue) => ({
    red: parseInt(colorValue.slice(0, 2), 16),
    green: parseInt(colorValue.slice(2, 4), 16),
    blue: parseInt(colorValue.slice(4, 6), 16)
});
const intToHex = (rgbint) => pad(Math.min(Math.max(Math.round(rgbint), 0), 255).toString(16), 2);
const rgbToHex = (rgb) => intToHex(rgb.red) + intToHex(rgb.green) + intToHex(rgb.blue);
const DEFAULT_STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const validateColorValue = (colorValue) => {
    if (typeof colorValue !== "string" || colorValue.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(colorValue)) {
        throw new TypeError("colorValue must be a 6-character hex string without '#'.");
    }
};
const resolveSteps = (steps) => {
    if (typeof steps === "undefined")
        return DEFAULT_STEPS;
    if (!Array.isArray(steps)) {
        throw new TypeError("steps must be an array of numbers.");
    }
    if (!steps.every((step) => typeof step === "number" && Number.isFinite(step))) {
        throw new TypeError("steps must be an array of numbers.");
    }
    return steps;
};
const mixChannel = (from, to, ratio) => from + (to - from) * ratio;
const calculateScale = (colorValue, steps, mixFn) => {
    validateColorValue(colorValue);
    const stepRatios = resolveSteps(steps);
    const color = hexToRGB(colorValue);
    const values = [];
    for (const ratio of stepRatios) {
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
export const calculateShades = (colorValue, steps) => calculateScale(colorValue, steps, rgbShade);
export const calculateTints = (colorValue, steps) => calculateScale(colorValue, steps, rgbTint);
