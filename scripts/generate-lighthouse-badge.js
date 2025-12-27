const { readdirSync, readFileSync, mkdirSync, writeFileSync } = require('fs');
const { join, dirname } = require('path');

const resultsDir = join(__dirname, '..', 'lhci-results');
const outputPath = join(__dirname, '..', 'assets', 'badges', 'lighthouse.json');

const lhrFiles = readdirSync(resultsDir)
  .filter((file) => file.startsWith('lhr-') && file.endsWith('.json'))
  .sort();

if (!lhrFiles.length) {
  throw new Error('No Lighthouse results found in lhci-results.');
}

const lhrPath = join(resultsDir, lhrFiles[0]);
const lhr = JSON.parse(readFileSync(lhrPath, 'utf8'));
const scoreValue = lhr?.categories?.performance?.score;

if (typeof scoreValue !== 'number') {
  throw new Error('Performance score missing from Lighthouse results.');
}

const score = Math.round(scoreValue * 100);
const color =
  score >= 90 ? 'brightgreen' :
  score >= 80 ? 'green' :
  score >= 70 ? 'yellowgreen' :
  score >= 60 ? 'yellow' :
  score >= 50 ? 'orange' :
  'red';

const badgePayload = {
  schemaVersion: 1,
  label: 'Lighthouse',
  message: `Perf ${score}`,
  color
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(badgePayload), 'utf8');
