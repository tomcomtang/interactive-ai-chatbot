import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import edgeone from '@edgeone/astro';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Load .env / .env.local from project root (does not depend on Vite envDir or CLI cwd). */
function loadLocalEnv() {
  const env = {};
  for (const name of ['.env', '.env.local']) {
    const file = path.join(__dirname, name);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return env;
}

const localEnv = loadLocalEnv();

/**
 * Astro Environment Variables Configuration for EdgeOne Pages
 *
 * EdgeOne Pages injects environment variables into process.env at runtime.
 * For server-side API routes, use process.env.VAR_NAME directly.
 *
 * envDir points to config dir so .env is loaded when running edgeone pages build from a subdir.
 */
export default defineConfig({
  output: 'server',
  adapter: edgeone(),
  integrations: [react()],
  vite: {
    envDir: __dirname,
    define: {
      'import.meta.env.DEEPSEEK_API_KEY': JSON.stringify(localEnv.DEEPSEEK_API_KEY ?? ''),
    },
  },
});
