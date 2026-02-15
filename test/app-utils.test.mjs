import test from "node:test";
import assert from "node:assert/strict";

import {
  isAcceptedUserHex,
  parseUserHexValues,
  normalizeHexForPicker,
  normalizeHexStrictSix
} from "../src/js/input-utils.js";
import {
  hexToRGB,
  rgbToHex,
  calculateComplementaryHex
} from "../src/js/color-space-utils.js";

test("isAcceptedUserHex accepts only 3/6-character user hex values", () => {
  assert.equal(isAcceptedUserHex("abc"), true);
  assert.equal(isAcceptedUserHex("#a1b2c3"), true);
  assert.equal(isAcceptedUserHex("abcd"), false);
  assert.equal(isAcceptedUserHex("11223344"), false);
  assert.equal(isAcceptedUserHex("zzzzzz"), false);
});

test("parseUserHexValues extracts and normalizes 3-character values", () => {
  assert.deepEqual(parseUserHexValues("abc #123456 ff0"), ["aabbcc", "123456", "ffff00"]);
  assert.equal(parseUserHexValues("no colors here"), null);
});

test("normalizeHexForPicker expands 3-character values and rejects invalid lengths", () => {
  assert.equal(normalizeHexForPicker("#abc"), "aabbcc");
  assert.equal(normalizeHexForPicker("A1b2C3"), "a1b2c3");
  assert.equal(normalizeHexForPicker("abcd"), "");
});

test("normalizeHexStrictSix enforces strict six-character hex", () => {
  assert.equal(normalizeHexStrictSix("#A1b2C3"), "a1b2c3");
  assert.equal(normalizeHexStrictSix("abc"), null);
  assert.equal(normalizeHexStrictSix("11223344"), null);
});

test("hexToRGB and rgbToHex round-trip known values", () => {
  assert.deepEqual(hexToRGB("3b82f6"), { red: 59, green: 130, blue: 246 });
  assert.equal(rgbToHex({ red: 59, green: 130, blue: 246 }), "3b82f6");
});

test("calculateComplementaryHex returns deterministic complementary values", () => {
  assert.equal(calculateComplementaryHex("3b82f6"), "f6af3b");
  assert.equal(calculateComplementaryHex("#3b82f6"), "f6af3b");
  assert.equal(calculateComplementaryHex("bad"), null);
});
