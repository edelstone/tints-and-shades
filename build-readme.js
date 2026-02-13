const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const TurndownService = require('turndown');

const turndownService = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

const aboutPath = join(__dirname, 'src', 'about.njk');
const readmePath = join(__dirname, 'README.md');

const aboutContent = readFileSync(aboutPath, 'utf8');
const siteUrl = 'https://maketintsandshades.com';

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

const removeLocalDevMarker = (content) => {
  const marker = '<!-- README-INSERT-LOCAL-DEV -->';
  if (!content.includes(marker)) {
    throw new Error('README insert marker not found in src/about.njk');
  }
  return content.replace(marker, '');
};

const sanitizedContent = removeLocalDevMarker(rawReadmeContent)
  .replace(/<!-- README-EXCLUDE-START -->[\s\S]*?<!-- README-EXCLUDE-END -->/g, '')
  .trim();

const rewriteReadmeLinks = (content) =>
  content.replace(/href="\/#colors=([0-9a-fA-F]+)"/g, `href="${siteUrl}/#colors=$1"`);

const markdownContent = turndownService.turndown(rewriteReadmeLinks(sanitizedContent));

const normalizeListSpacing = (content) =>
  content
    .replace(/^(\s*[-+*])\s{2,}/gm, '$1 ')
    .replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ');

const normalizedMarkdown = normalizeListSpacing(markdownContent);

if (!/^## Calculation method\b/m.test(normalizedMarkdown)) {
  throw new Error('Expected heading missing after README conversion.');
}

const normalizedMarkdownWithLocalDev = normalizedMarkdown.replace(
  /\(\/#colors=([0-9a-fA-F]+)\)/g,
  `(${siteUrl}/#colors=$1)`
);

const localDevMarkdown = normalizeListSpacing(turndownService.turndown(localDevHtml)).trim();

const coreApiSection = `
## Core API Package

- Published on npm: [@edelstone/tints-and-shades](https://www.npmjs.com/package/@edelstone/tints-and-shades)
- Source location: [packages/tints-and-shades](packages/tints-and-shades)
- Build locally: \`npm run build:api\`
- Run package tests: \`npm run test:api\`
- App integration note: during development, the web app consumes the local workspace build at \`packages/tints-and-shades/dist/index.js\`.`;

const injectContributorSections = (content) => {
  const supportHeading = '## Support this project';
  if (!content.includes(supportHeading)) {
    throw new Error('Support section heading not found in generated README content.');
  }
  const sections = `${localDevMarkdown}\n\n${coreApiSection.trim()}\n`;
  return content.replace(supportHeading, `${sections}\n${supportHeading}`);
};

const readmeTemplate = `# [Tint & Shade Generator](https://maketintsandshades.com)

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

${injectContributorSections(normalizedMarkdownWithLocalDev)}`;

const readmeOutput = `${readmeTemplate}\n`;
writeFileSync(readmePath, readmeOutput, 'utf8');
console.log('README.md has been generated.');
