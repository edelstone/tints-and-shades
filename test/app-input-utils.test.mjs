import test from "node:test";
import assert from "node:assert/strict";

import {
  isActivationKey,
  isAcceptedUserHex,
  parseUserHexValues,
  normalizeHexForPaletteCell,
  normalizeHexForPicker,
  normalizeHexForExport,
  normalizeHexStrictSix
} from "../src/js/input-utils.js";
import { normalizeHex } from "../packages/tints-and-shades/dist/index.js";

test("isAcceptedUserHex accepts only 3/6-character user hex values", () => {
  assert.equal(isAcceptedUserHex("abc"), true);
  assert.equal(isAcceptedUserHex("#a1b2c3"), true);
  assert.equal(isAcceptedUserHex("abcd"), false);
  assert.equal(isAcceptedUserHex("11223344"), false);
  assert.equal(isAcceptedUserHex("zzzzzz"), false);
});

test("isActivationKey accepts key strings, key codes, and key events", () => {
  assert.equal(isActivationKey("Enter"), true);
  assert.equal(isActivationKey("spacebar"), true);
  assert.equal(isActivationKey(13), true);
  assert.equal(isActivationKey(32), true);
  assert.equal(isActivationKey({ key: "Enter" }), true);
  assert.equal(isActivationKey({ code: "NumpadEnter" }), true);
  assert.equal(isActivationKey({ keyCode: 13 }), true);
  assert.equal(isActivationKey({ which: 32 }), true);
  assert.equal(isActivationKey({ key: "Escape" }), false);
  assert.equal(isActivationKey(27), false);
});

test("parseUserHexValues extracts and normalizes 3-character values", () => {
  assert.deepEqual(parseUserHexValues("abc #123456 ff0"), ["aabbcc", "123456", "ffff00"]);
  assert.equal(parseUserHexValues("no colors here"), null);
});

test("parseUserHexValues respects token boundaries and ignores longer tokens", () => {
  assert.deepEqual(parseUserHexValues("abc,def 123456"), ["aabbcc", "ddeeff", "123456"]);
  assert.equal(parseUserHexValues("abcde 1234567"), null);
  assert.deepEqual(parseUserHexValues("#abc #def"), ["aabbcc", "ddeeff"]);
});

test("normalizeHexForPicker expands 3-character values and rejects invalid lengths", () => {
  assert.equal(normalizeHexForPicker("#abc"), "aabbcc");
  assert.equal(normalizeHexForPicker("A1b2C3"), "a1b2c3");
  assert.equal(normalizeHexForPicker("abcd"), "");
});

test("normalizeHexForPicker sanitizes non-hex characters before length checks", () => {
  assert.equal(normalizeHexForPicker(" #a!b@c "), "aabbcc");
  assert.equal(normalizeHexForPicker("12-34-56"), "123456");
  assert.equal(normalizeHexForPicker("###"), "");
});

test("normalizeHexForPaletteCell and normalizeHexForExport preserve app-specific behavior", () => {
  assert.equal(normalizeHexForPaletteCell("#A1b2C3"), "A1b2C3");
  assert.equal(normalizeHexForPaletteCell("  #abc  "), "abc");
  assert.equal(normalizeHexForExport("#A1b2C3"), "A1b2C3");
  assert.equal(normalizeHexForExport("#12345678"), "123456");
  assert.equal(normalizeHexForExport(123456), "");
});

test("normalizeHexStrictSix enforces strict six-character hex", () => {
  assert.equal(normalizeHexStrictSix("#A1b2C3"), "a1b2c3");
  assert.equal(normalizeHexStrictSix("abc"), null);
  assert.equal(normalizeHexStrictSix("11223344"), null);
});

test("normalizeHexStrictSix aligns with package normalizeHex for six-character inputs", () => {
  const candidates = ["#A1b2C3", "a1b2c3", "ABCDEF", "123456"];
  candidates.forEach((value) => {
    assert.equal(normalizeHexStrictSix(value), normalizeHex(value));
  });
});
