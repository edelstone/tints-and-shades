# @edelstone/tints-and-shades

Deterministic tint and shade generator for 6-character hex colors.  
Used internally by the [Tint & Shade Generator](https://maketintsandshades.com) and published as a standalone API.

## Install

```bash
npm install @edelstone/tints-and-shades
```

## API

```ts
calculateTints(colorValue: string, steps?: number[]): ScaleColor[]
calculateShades(colorValue: string, steps?: number[]): ScaleColor[]
```

```ts
type ScaleColor = {
  hex: string;
  ratio: number;
  percent: number;
};
```

### Parameters

- **colorValue**  
  6-character hex string without `#`, e.g. `3b82f6`  
  Must be a valid 6-character hex value.

- **steps** (optional)  
  Array of finite numeric mix ratios.  
  Example: `[0, 0.1, 0.2, 0.3]`

If omitted, the default steps are:

```js
[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
```

## Returns

An array of `ScaleColor` objects:

- `hex`: 6-character hex string (without `#`)
- `ratio`: numeric step ratio used for the mix
- `percent`: `ratio` expressed as a percentage (rounded to 1 decimal)

## Example

```js
import { calculateTints, calculateShades } 
  from "@edelstone/tints-and-shades";

const tints = calculateTints("000000", [0, 0.5, 1]);
const shades = calculateShades("ffffff", [0, 0.5, 1]);
```

Tints output:

```json
[
  { "hex": "000000", "ratio": 0, "percent": 0 },
  { "hex": "808080", "ratio": 0.5, "percent": 50 },
  { "hex": "ffffff", "ratio": 1, "percent": 100 }
]
```

Shades output:

```json
[
  { "hex": "ffffff", "ratio": 0, "percent": 0 },
  { "hex": "808080", "ratio": 0.5, "percent": 50 },
  { "hex": "000000", "ratio": 1, "percent": 100 }
]
```

## Validation

- `colorValue` must be a 6-character hex string (no `#`).
- Invalid values throw a `TypeError`.
- `steps` must be an array of finite numbers.
- Invalid `steps` input throws a `TypeError`.

## Learn More

- Calculation method and rationale: [Tint & Shade Generator docs](https://maketintsandshades.com/about/#calculation-method)

## Development

From repo root:

```bash
npm run build:api
npm run test:api
```

From package directory:

```bash
npm run build
npm run test
```
