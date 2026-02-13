import test from "node:test";
import assert from "node:assert/strict";

import { calculateTints, calculateShades } from "../dist/generator.js";

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
