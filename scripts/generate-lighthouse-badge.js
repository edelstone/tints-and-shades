const { readdirSync, readFileSync, mkdirSync, writeFileSync } = require('fs');
const { join, dirname } = require('path');

const resultsDirCandidates = [
  join(__dirname, '..', 'lhci-results'),
  join(__dirname, '..', '.lighthouseci')
];
const outputPath = join(__dirname, '..', 'assets', 'badges', 'lighthouse.json');

const pickResultsDir = () => {
  for (const candidate of resultsDirCandidates) {
    try {
      const files = readdirSync(candidate);
      if (files.some((file) => file.startsWith('lhr-') && file.endsWith('.json'))) {
        return candidate;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  return null;
};

const resultsDir = pickResultsDir();
if (!resultsDir) {
  throw new Error('No Lighthouse results found in lhci-results or .lighthouseci.');
}

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
