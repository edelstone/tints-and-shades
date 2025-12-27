const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const TurndownService = require('turndown');

const turndownService = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

const aboutPath = join(__dirname, 'src', 'about.njk');
const readmePath = join(__dirname, 'README.md');

const aboutContent = readFileSync(aboutPath, 'utf8');

const match = aboutContent.match(/<!-- START README CONTENT -->([\s\S]*?)<!-- END README CONTENT -->/);
if (!match) {
  throw new Error('README markers not found or misordered in src/about.njk');
}

const rawReadmeContent = match[1];
if (!rawReadmeContent.trim()) {
  throw new Error('README content block is empty in src/about.njk');
}

const localDevHtml = `<h2>Local development</h2>
<p><em>Prerequisites: Node.js 18+</em></p>
<ol>
  <li>Clone this project.</li>
  <li>Navigate to the project in your terminal.</li>
  <li>Install dependencies: <code>npm install</code>.</li>
  <li>Start the server: <code>npm run start</code>.</li>
  <li>Navigate to <code>localhost:8080</code> in your browser.</li>
</ol>`;

const insertLocalDevSection = (content) => {
  const marker = '<!-- README-INSERT-LOCAL-DEV -->';
  if (!content.includes(marker)) {
    throw new Error('README insert marker not found in src/about.njk');
  }
  return content.replace(marker, localDevHtml);
};

const sanitizedContent = insertLocalDevSection(rawReadmeContent)
  .replace(/<!-- README-EXCLUDE-START -->[\s\S]*?<!-- README-EXCLUDE-END -->/g, '')
  .trim();

const markdownContent = turndownService.turndown(sanitizedContent);

const normalizeListSpacing = (content) =>
  content
    .replace(/^(\s*[-+*])\s{2,}/gm, '$1 ')
    .replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ');

const normalizedMarkdown = normalizeListSpacing(markdownContent);

if (!/^## Calculation method\b/m.test(normalizedMarkdown)) {
  throw new Error('Expected heading missing after README conversion.');
}

const normalizedMarkdownWithLocalDev = normalizedMarkdown;

const badgeRow = `[![Lighthouse](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fedelstone%2Ftints-and-shades%2Fmain%2Fassets%2Fbadges%2Flighthouse.json&style=for-the-badge&cacheSeconds=60)](https://github.com/edelstone/tints-and-shades/actions/workflows/lighthouse.yml)
[![Uptime](https://img.shields.io/uptimerobot/ratio/m802057964-ccc7bb7005a502e6c6fb8eb4?style=for-the-badge)](https://stats.uptimerobot.com/QYdgLvy4p7)
[![License](https://img.shields.io/github/license/edelstone/tints-and-shades?style=for-the-badge)](LICENSE)`;

const readmeTemplate = `# [<img src="src/icon.svg" width="28px" alt="" />](https://maketintsandshades.com) &nbsp;[Tint & Shade Generator](https://maketintsandshades.com)

${badgeRow}

<a href="https://maketintsandshades.com">
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
</a>

${normalizedMarkdownWithLocalDev}`;

const readmeOutput = `${readmeTemplate}\n`;
writeFileSync(readmePath, readmeOutput, 'utf8');
console.log('README.md has been generated.');
