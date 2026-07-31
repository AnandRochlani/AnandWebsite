let drafts = [];

if (typeof window === 'undefined') {
  // Node path used by the prerenderer and Vercel functions.
  const fs = globalThis.process.getBuiltinModule('node:fs');
  const path = globalThis.process.getBuiltinModule('node:path');
  const { fileURLToPath } = globalThis.process.getBuiltinModule('node:url');
  const dataDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../seo-pipeline/articles'
  );
  drafts = fs
    .readdirSync(dataDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8')));
} else {
  // Vite replaces import.meta.glob with bundled JSON modules for the browser.
  const modules = import.meta.glob('../../seo-pipeline/articles/*.json', {
    eager: true,
    import: 'default',
  });
  drafts = Object.values(modules);
}

drafts.sort((a, b) => Number(a.order) - Number(b.order));

// Stable fallback IDs are used only when the database is unavailable. Production
// inserts use the database sequence and preserve their assigned IDs thereafter.
export const seoArticles = drafts.map((article, index) => ({
  ...article,
  id: 1000 + index,
}));
