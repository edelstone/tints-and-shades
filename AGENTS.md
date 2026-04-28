# AGENTS.md

## Scope

Instructions in this file apply to the entire repository.

## Project shape

- Astro app lives in `src/`.
- Reusable npm package lives in `packages/tints-and-shades/`.
- Tests live in `test/` and `packages/tints-and-shades/test/`.
- `README.md` is partially generated from `src/shared/about.html` via `build-readme.js`.

## Commands

- Install: `npm install`
- App dev server with README watcher: `npm run start`
- App-only dev server: `npm run dev`
- Production build: `npm run build`
- App tests: `npm run test:app`
- Package tests: `npm run test:api`
- Refresh README content: `npm run build:readme`

## Guardrails

- Use Node.js `22.12+` as declared in `package.json`.
- If you change `src/shared/about.html` or `build-readme.js`, run `npm run build:readme`.
- If you change code under `packages/tints-and-shades/src/`, run `npm run test:api`.
- If you change app behavior in `src/` or shared browser scripts, run `npm run test:app`.
- Do not hand-edit generated README sections without also updating the source that generates them.

## Release note

- For npm package releases, follow `RELEASING.md`.
