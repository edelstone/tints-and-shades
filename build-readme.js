// Reads the shared About HTML content, injects additional sections, converts
// everything to Markdown and builds README. Do not edit README directly.
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const TurndownService = require('turndown');

const turndownService = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

const aboutPath = join(__dirname, 'src', 'shared', 'about.html');
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
   <img alt="Screenshot of palettes" src="assets/palettes-light.png" />
 </picture>
</a>`;

const coreApiSection = `## API

The Tint & Shade Generator exposes its color engine as a standalone API. It generates tints and shades, derives related palettes, and performs common color normalization and conversion.

It can also be used independently in your projects.

### Usage and examples

- npm: [@edelstone/tints-and-shades](https://www.npmjs.com/package/@edelstone/tints-and-shades)
- Source: [packages/tints-and-shades](packages/tints-and-shades)`;

const localDevSection = `## Local development

_Prerequisites: Node.js 22.12+_

1. Clone this project
1. Install dependencies: \`npm install\`
1. Start the server: \`npm start\`
1. Open \`localhost:4321\``;

const insertMarkers = {
  pictures: '<!-- README-INSERT-PICTURES -->',
  coreApi: '<!-- README-INSERT-CORE-API -->',
  localDev: '<!-- README-INSERT-LOCAL-DEV -->',
};

const rawReadmeContent = readFileSync(aboutPath, 'utf8').trim();
if (!rawReadmeContent.trim()) throw new Error('README content block is empty in src/shared/about.html');

Object.values(insertMarkers).forEach((marker) => {
  if (!rawReadmeContent.includes(marker)) {
    throw new Error(`README insert marker not found in src/shared/about.html: ${marker}`);
  }
});

const tokenizedContent = rawReadmeContent
  .replace(insertMarkers.pictures, 'READMETOKENPICTURES')
  .replace(insertMarkers.coreApi, 'READMETOKENCOREAPI')
  .replace(insertMarkers.localDev, 'READMETOKENLOCALDEV')
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
  .replace('READMETOKENCOREAPI', `\n\n${coreApiSection}\n\n`)
  .replace('READMETOKENLOCALDEV', `\n\n${localDevSection}\n\n`)
  .replace(/\n[ \t]+\n/g, '\n\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

if (!/^## Calculation method\b/m.test(readmeBody)) {
  throw new Error('Expected heading missing after README conversion.');
}

const readmeOutput = `# [Tint & Shade Generator](https://maketintsandshades.com)\n\n${readmeBody}\n`;
writeFileSync(readmePath, readmeOutput, 'utf8');
console.log('README.md has been generated.');
