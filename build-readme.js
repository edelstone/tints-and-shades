const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

// Initialize Turndown service
const turndownService = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-'})

// Paths to the source and destination files
const aboutPath = path.join(__dirname, 'src', 'about.njk');
const readmePath = path.join(__dirname, 'README.md');

// Read the content of the about.njk file
const aboutContent = fs.readFileSync(aboutPath, 'utf8');

// Extract the relevant content from about.njk
// Assuming the content to be extracted is between specific markers
const startMarker = '<!-- START README CONTENT -->';
const endMarker = '<!-- END README CONTENT -->';
const startIndex = aboutContent.indexOf(startMarker) + startMarker.length;
const endIndex = aboutContent.indexOf(endMarker);
const extractedContent = aboutContent.substring(startIndex, endIndex).trim();

// Convert HTML to Markdown
const markdownContent = turndownService.turndown(extractedContent);

// Create the README content
const readmeContent = 
`# [<img src="src/icon.svg" width="28px" />](https://maketintsandshades.com) &nbsp;[Tint & Shade Generator](https://maketintsandshades.com)

<a href="https://maketintsandshades.com">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="assets/home-dark.png" />
   <source media="(prefers-color-scheme: light)" srcset="assets/home-light.png" />
   <img alt="Screenshot of app home page" src="assets/home-light.png" />
 </picture>
</a>

<a href="https://maketintsandshades.com">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="assets/colors-dark.png" />
   <source media="(prefers-color-scheme: light)" srcset="assets/colors-light.png" />
   <img alt="Screenshot of app home page" src="assets/colors-light.png" />
 </picture>
</a>

## Local development

This project uses the [Eleventy static site generator](https://www.11ty.dev) and deploys to GitHub Pages using a clever [GitHub Action from Shohei Ueda](https://github.com/peaceiris/actions-gh-pages).

_Prerequisites: Node.js 14+_

1.  Clone this project.
2.  Navigate to the project in your terminal.
3.  Install dependencies: \`npm install\`.
4.  Start the server: \`npm run start\`.
5.  Navigate to \`localhost:8080\` in your browser.

${markdownContent}`;

// Write the content to README.md
fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('README.md has been generated.');