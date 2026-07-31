// Node module-resolution hook that aliases @neondatabase/serverless to our
// in-process pg-mem-backed shim. Registered via:
//   node --import ./tools/neon-loader.mjs ...
//
// Only used during local verification.

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { register } from 'node:module';

const SHIM_URL = pathToFileURL(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'neon-shim.mjs')
).href;

register('./neon-loader-hook.mjs', import.meta.url, {
  data: { shimUrl: SHIM_URL },
});
