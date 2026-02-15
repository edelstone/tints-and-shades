import { calculateTints as apiCalculateTints, calculateShades as apiCalculateShades } from "/packages/tints-and-shades/dist/index.js";

const DEFAULT_STEPS = 10;
const buildStepRatios = (steps = DEFAULT_STEPS) => {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new TypeError("steps must be a positive integer.");
  }
  return Array.from({ length: steps }, (_, index) => index / steps);
};

const calculateShades = (colorValue, steps = DEFAULT_STEPS) => {
  return apiCalculateShades(colorValue, buildStepRatios(steps));
};

const calculateTints = (colorValue, steps = DEFAULT_STEPS) => {
  return apiCalculateTints(colorValue, buildStepRatios(steps));
};

const colorUtils = {
  calculateShades,
  calculateTints
};

export {
  calculateShades,
  calculateTints
};

export default colorUtils;
