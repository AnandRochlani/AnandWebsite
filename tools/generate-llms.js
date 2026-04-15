import fs from 'fs';
import path from 'path';

/**
 * Vercel build hook.
 *
 * Some deployments run `node tools/generate-llms.js` before `npm run build`.
 * Keep this script present and idempotent so builds don't fail when the file
 * is missing. If `public/llms.txt` already exists, we leave it unchanged.
 */

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const llmsPath = path.join(publicDir, 'llms.txt');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(llmsPath)) {
  const contents = `# llms.txt - AI Model Instructions\n# Learn more: https://llmstxt.org/\n\nSite: AnandRochlani\nLanguage: en-US\n`;
  fs.writeFileSync(llmsPath, contents, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Created ${path.relative(rootDir, llmsPath)}`);
} else {
  // eslint-disable-next-line no-console
  console.log(`OK ${path.relative(rootDir, llmsPath)} already exists`);
}

