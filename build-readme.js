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

const sanitizedContent = match[1]
  .replace(/<!-- README-EXCLUDE-START -->[\s\S]*?<!-- README-EXCLUDE-END -->/g, '')
  .trim();

const markdownContent = turndownService.turndown(sanitizedContent);

const normalizeListSpacing = (content) =>
  content
    .replace(/^(\s*[-+*])\s{2,}/gm, '$1 ')
    .replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ');

const normalizedMarkdown = normalizeListSpacing(markdownContent);

const localDevSection = `## Local development

This project uses the [Eleventy static site generator](https://www.11ty.dev) and deploys to GitHub Pages using a [GitHub Action from Shohei Ueda](https://github.com/marketplace/actions/github-pages-action).

*Prerequisites: Node.js 18+*

1. Clone this project.
2. Navigate to the project in your terminal.
3. Install dependencies: \`npm install\`.
4. Start the server: \`npm run start\`.
5. Navigate to \`localhost:8080\` in your browser.`;

const insertLocalDevSection = (content) => {
  // Guard: don’t insert if it already exists
  if (/^## Local development\b/m.test(content)) {
    return content;
  }

  const marker = '## Support this project';
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    return `${content.trimEnd()}\n\n${localDevSection}`;
  }
  const before = content.slice(0, markerIndex).trimEnd();
  const after = content.slice(markerIndex);
  return `${before}\n\n${localDevSection}\n\n${after}`;
};

const normalizedMarkdownWithLocalDev = insertLocalDevSection(normalizedMarkdown);

const readmeTemplate = `# [<img src="src/icon.svg" width="28px" alt="" />](https://maketintsandshades.com) &nbsp;[Tint & Shade Generator](https://maketintsandshades.com)

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
