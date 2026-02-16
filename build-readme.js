// Reads about.njk, injects additional sections, converts everything to Markdown
// and builds README. Do not edit README directly
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const TurndownService = require('turndown');

const turndownService = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

const aboutPath = join(__dirname, 'src', 'about.njk');
const readmePath = join(__dirname, 'README.md');
const siteUrl = 'https://maketintsandshades.com';

const picturesSection = `<a href="https://maketintsandshades.com">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="assets/home-dark.png" />
   <source media="(prefers-color-scheme: light)" srcset="assets/home-light.png" />
   <img alt="Screenshot of app home page" src="assets/home-light.png" />
 </picture>
</a>

<a href="https://maketintsandshades.com">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="assets/palettes-dark.png" />
   <source media="(prefers-color-scheme: light)" srcset="assets/palettes-light.png" />
   <img alt="Screenshot of app home page" src="assets/palettes-light.png" />
 </picture>
</a>`;

const localDevSection = `## Local development

_Prerequisites: Node.js 18+_

1. Clone this project.
2. Navigate to the project in your terminal.
3. Install dependencies: \`npm install\`.
4. Start the server: \`npm run start\`.
5. Navigate to \`localhost:8080\` in your browser.`;

const coreApiSection = `## Core API package

- Published on npm: [@edelstone/tints-and-shades](https://www.npmjs.com/package/@edelstone/tints-and-shades)
- Source location: [packages/tints-and-shades](packages/tints-and-shades)
- Includes generation (\`calculateTints\`, \`calculateShades\`), normalization (\`normalizeHex\`), relationships (complementary/split-complementary/analogous/triadic), and conversions (hex↔rgb, rgb↔hsl).
- Build locally: \`npm run build:api\`
- Run package tests: \`npm run test:api\`
- App integration note: during development, the web app consumes the local workspace build at \`packages/tints-and-shades/dist/index.js\`.`;

const insertMarkers = {
  pictures: '<!-- README-INSERT-PICTURES -->',
  localDev: '<!-- README-INSERT-LOCAL-DEV -->',
  coreApi: '<!-- README-INSERT-CORE-API -->',
};

const aboutContent = readFileSync(aboutPath, 'utf8');
const rawReadmeContent = aboutContent
  .replace(/^---[\s\S]*?---\s*/, '')
  .trim();
if (!rawReadmeContent.trim()) throw new Error('README content block is empty in src/about.njk');

Object.values(insertMarkers).forEach((marker) => {
  if (!rawReadmeContent.includes(marker)) {
    throw new Error(`README insert marker not found in src/about.njk: ${marker}`);
  }
});

const tokenizedContent = rawReadmeContent
  .replace(insertMarkers.pictures, 'READMETOKENPICTURES')
  .replace(insertMarkers.localDev, 'READMETOKENLOCALDEV')
  .replace(insertMarkers.coreApi, 'READMETOKENCOREAPI')
  .replace(/<!-- README-EXCLUDE-START -->[\s\S]*?<!-- README-EXCLUDE-END -->/g, '')
  .replace(/href="\/#colors=([0-9a-fA-F]+)"/g, `href="${siteUrl}/#colors=$1"`)
  .trim();

const normalizeListSpacing = (content) =>
  content
    .replace(/^(\s*[-+*])\s{2,}/gm, '$1 ')
    .replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ');

const readmeBody = normalizeListSpacing(turndownService.turndown(tokenizedContent))
  .replace(/\(\/#colors=([0-9a-fA-F]+)\)/g, `(${siteUrl}/#colors=$1)`)
  .replace('READMETOKENPICTURES', `\n\n${picturesSection}\n\n`)
  .replace('READMETOKENLOCALDEV', `\n\n${localDevSection}\n\n`)
  .replace('READMETOKENCOREAPI', `\n\n${coreApiSection}\n\n`)
  .replace(/\n[ \t]+\n/g, '\n\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

if (!/^## Calculation method\b/m.test(readmeBody)) {
  throw new Error('Expected heading missing after README conversion.');
}

const readmeOutput = `# [Tint & Shade Generator](https://maketintsandshades.com)\n\n${readmeBody}\n`;
writeFileSync(readmePath, readmeOutput, 'utf8');
console.log('README.md has been generated.');
