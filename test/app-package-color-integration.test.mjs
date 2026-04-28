import test from "node:test";
import assert from "node:assert/strict";

import {
  hexToRgb,
  rgbToHex,
  getComplementaryHex,
  getSplitComplementaryHexes,
  getAnalogousHexes,
  getTriadicHexes
} from "../packages/tints-and-shades/dist/index.js";

test("hexToRgb and rgbToHex round-trip known values", () => {
  assert.deepEqual(hexToRgb("3b82f6"), { red: 59, green: 130, blue: 246 });
  assert.equal(rgbToHex({ red: 59, green: 130, blue: 246 }), "3b82f6");
});

test("getComplementaryHex returns deterministic complementary values", () => {
  assert.equal(getComplementaryHex("3b82f6"), "f6af3b");
  assert.equal(getComplementaryHex("#3b82f6"), "f6af3b");
  assert.equal(getComplementaryHex("bad"), "ccddaa");
  assert.throws(() => getComplementaryHex("zzzzzz"), /colorValue must be a valid 3- or 6-character hex string/);
});

test("relationship helpers return stable outputs for a known base", () => {
  assert.deepEqual(getSplitComplementaryHexes("3b82f6"), ["f6523b", "dff63b"]);
  assert.deepEqual(getAnalogousHexes("3b82f6"), ["3bdff6", "513bf6"]);
  assert.deepEqual(getTriadicHexes("3b82f6"), ["f63b82", "82f63b"]);
});
