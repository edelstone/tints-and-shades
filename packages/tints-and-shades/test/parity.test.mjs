import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateTints,
  calculateShades,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getComplementaryHex,
  getSplitComplementaryHexes,
  getAnalogousHexes,
  getTriadicHexes
} from "../dist/index.js";

const DEFAULT_STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

test("calculateTints uses default steps when omitted", () => {
  assert.deepEqual(calculateTints("663399"), calculateTints("663399", DEFAULT_STEPS));
});

test("calculateShades uses default steps when omitted", () => {
  assert.deepEqual(calculateShades("663399"), calculateShades("663399", DEFAULT_STEPS));
});

test("calculateTints returns exact locked output for known input", () => {
  assert.deepEqual(calculateTints("663399", [0, 0.2, 0.4, 0.6, 0.8]), [
    { hex: "663399", ratio: 0, percent: 0 },
    { hex: "855cad", ratio: 0.2, percent: 20 },
    { hex: "a385c2", ratio: 0.4, percent: 40 },
    { hex: "c2add6", ratio: 0.6, percent: 60 },
    { hex: "e0d6eb", ratio: 0.8, percent: 80 }
  ]);
});

test("calculateShades returns exact locked output for known input", () => {
  assert.deepEqual(calculateShades("663399", [0, 0.2, 0.4, 0.6, 0.8]), [
    { hex: "663399", ratio: 0, percent: 0 },
    { hex: "52297a", ratio: 0.2, percent: 20 },
    { hex: "3d1f5c", ratio: 0.4, percent: 40 },
    { hex: "29143d", ratio: 0.6, percent: 60 },
    { hex: "140a1f", ratio: 0.8, percent: 80 }
  ]);
});

test("throws when steps is not an array of numbers", () => {
  assert.throws(
    () => calculateTints("ca228e", 10),
    /steps must be an array of numbers/
  );
  assert.throws(
    () => calculateShades("ca228e", [0, "0.2", 0.4]),
    /steps must be an array of numbers/
  );
});

test("throws when colorValue is not a valid 6-character hex string", () => {
  assert.throws(
    () => calculateTints("abc"),
    /colorValue must be a 6-character hex string without '#'/,
  );
  assert.throws(
    () => calculateShades("zzzzzz"),
    /colorValue must be a 6-character hex string without '#'/,
  );
});

test("normalizeHex normalizes # prefix and 3-character values", () => {
  assert.equal(normalizeHex("#abc"), "aabbcc");
  assert.equal(normalizeHex("A1b2C3"), "a1b2c3");
  assert.equal(normalizeHex("zzzzzz"), null);
});

test("hexToRgb and rgbToHex round-trip known values", () => {
  assert.deepEqual(hexToRgb("3b82f6"), { red: 59, green: 130, blue: 246 });
  assert.deepEqual(hexToRgb("#abc"), { red: 170, green: 187, blue: 204 });
  assert.equal(rgbToHex({ red: 59, green: 130, blue: 246 }), "3b82f6");
});

test("rgbToHsl and hslToRgb convert as expected", () => {
  const hsl = rgbToHsl({ red: 59, green: 130, blue: 246 });
  assert.equal(Math.round(hsl.hue), 217);
  assert.equal(Math.round(hsl.saturation * 1000) / 1000, 0.912);
  assert.equal(Math.round(hsl.lightness * 1000) / 1000, 0.598);
  assert.deepEqual(hslToRgb(hsl), { red: 59, green: 130, blue: 246 });
});

test("relationship helpers return deterministic hex outputs", () => {
  assert.equal(getComplementaryHex("3b82f6"), "f6af3b");
  assert.deepEqual(getSplitComplementaryHexes("3b82f6"), ["f6523b", "dff63b"]);
  assert.deepEqual(getAnalogousHexes("3b82f6"), ["3bdff6", "513bf6"]);
  assert.deepEqual(getTriadicHexes("3b82f6"), ["f63b82", "82f63b"]);
});

test("relationship helpers accept normalizable input and validate invalid values", () => {
  assert.equal(getComplementaryHex("#abc"), "ccbbaa");
  assert.throws(
    () => getTriadicHexes("nope"),
    /colorValue must be a valid 3- or 6-character hex string with optional '#'/,
  );
});
