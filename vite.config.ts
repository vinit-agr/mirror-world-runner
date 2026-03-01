import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/** Read a directory and return { name, file } entries for every .fbx file. */
function getFbxList(dir: string) {
  try {
    return fs
      .readdirSync(dir)
      .filter((f: string) => f.toLowerCase().endsWith('.fbx'))
      .map((f: string) => ({
        name: f.replace(/\.fbx$/i, ''),
        file: f,
      }));
  } catch {
    return [];
  }
}

/**
 * Vite plugin that dynamically serves manifest.json for both
 * characters and animations by reading their directories at request time.
 * No static manifest files needed — just drop .fbx files and refresh.
 */
function modelManifestPlugin() {
  const charsDir = path.join(process.cwd(), 'public/models/characters');
  const animsDir = path.join(process.cwd(), 'public/models/anims');

  return {
    name: 'model-manifest',
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use(
        '/models/characters/manifest.json',
        (_req: unknown, res: { setHeader: Function; end: Function }) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ characters: getFbxList(charsDir) }));
        },
      );
      server.middlewares.use(
        '/models/anims/manifest.json',
        (_req: unknown, res: { setHeader: Function; end: Function }) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ animations: getFbxList(animsDir) }));
        },
      );
    },
    writeBundle(options: { dir?: string }) {
      const outDir = options.dir || 'dist';
      for (const [subdir, key] of [['characters', 'characters'], ['anims', 'animations']] as const) {
        const manifestDir = path.join(outDir, 'models', subdir);
        if (fs.existsSync(manifestDir)) {
          const srcDir = path.join(process.cwd(), 'public/models', subdir);
          const items = getFbxList(srcDir);
          fs.writeFileSync(
            path.join(manifestDir, 'manifest.json'),
            JSON.stringify({ [key]: items }, null, 2),
          );
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), modelManifestPlugin()],
})
