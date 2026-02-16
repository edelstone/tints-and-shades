# @edelstone/tints-and-shades

Deterministic color toolkit for tints, shades, color-wheel relationships, hex normalization, and hex/RGB/HSL conversion.  
Used internally by the [Tint & Shade Generator](https://maketintsandshades.com) and published here as a standalone API.

## Install

```bash
npm install @edelstone/tints-and-shades
```

## Quick example

```js
import {
  normalizeHex,
  calculateTints,
  calculateShades,
  getComplementaryHex
} from "@edelstone/tints-and-shades";

const baseHex = normalizeHex("#3bf"); // "33bbff"
if (!baseHex) throw new Error("Invalid color");

const tints = calculateTints(baseHex, [0, 0.5, 1]);
const shades = calculateShades(baseHex, [0, 0.5, 1]);
const complementary = getComplementaryHex(baseHex);
```

```json
{
  "complementary": "ff7733",
  "tints": [
    { "hex": "33bbff", "ratio": 0, "percent": 0 },
    { "hex": "99ddff", "ratio": 0.5, "percent": 50 },
    { "hex": "ffffff", "ratio": 1, "percent": 100 }
  ],
  "shades": [
    { "hex": "33bbff", "ratio": 0, "percent": 0 },
    { "hex": "1a5e80", "ratio": 0.5, "percent": 50 },
    { "hex": "000000", "ratio": 1, "percent": 100 }
  ]
}
```

## API

### Generation

```ts
calculateTints(colorValue: string, steps?: number[]): ScaleColor[]
calculateShades(colorValue: string, steps?: number[]): ScaleColor[]

type ScaleColor = {
  hex: string;
  ratio: number;
  percent: number;
};
```

Default steps: `[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]`

### Normalization

```ts
normalizeHex(value: string): string | null
```

Returns canonical 6-character lowercase hex without `#` (3-character hex is expanded), or `null` if invalid.

### Relationships

```ts
getComplementaryHex(colorValue: string): string
getSplitComplementaryHexes(colorValue: string): [string, string]
getAnalogousHexes(colorValue: string): [string, string]
getTriadicHexes(colorValue: string): [string, string]
```

Hue is rotated by standard offsets while preserving saturation and lightness.

### Conversions

```ts
hexToRgb(colorValue: string): RGB
rgbToHex(rgb: RGB): string
rgbToHsl(rgb: RGB): HSL
hslToRgb(hsl: HSL): RGB

type RGB = {
  red: number;
  green: number;
  blue: number;
};

type HSL = {
  hue: number;
  saturation: number;
  lightness: number;
};
```

Converts between hex, RGB, and HSL using deterministic channel clamping and standard HSL conversion math.

## Validation rules

- Generation requires a 6-character hex string (no `#`) and finite numeric steps.
- Relationship and conversion helpers accept valid 3- or 6-character hex (optional `#`).
- `normalizeHex` returns `null` for invalid input.
- Other helpers throw `TypeError` for invalid input.
