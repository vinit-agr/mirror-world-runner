import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function getCharacterList() {
  const dir = path.join(process.cwd(), 'public/models/characters');
  try {
    const files = fs.readdirSync(dir).filter((f: string) =>
      f.toLowerCase().endsWith('.fbx'),
    );
    return files.map((f: string) => ({
      name: f.replace(/\.fbx$/i, ''),
      file: f,
    }));
  } catch {
    return [];
  }
}

function characterManifestPlugin() {
  return {
    name: 'character-manifest',
    // Dev: serve manifest dynamically by reading the directory
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use(
        '/models/characters/manifest.json',
        (_req: unknown, res: { setHeader: Function; end: Function }) => {
          const characters = getCharacterList();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ characters }));
        },
      );
    },
    // Build: write manifest.json into the output directory
    writeBundle(options: { dir?: string }) {
      const outDir = options.dir || 'dist';
      const manifestDir = path.join(outDir, 'models', 'characters');
      const manifestPath = path.join(manifestDir, 'manifest.json');
      // Only write if the characters directory was copied to the build
      if (fs.existsSync(manifestDir)) {
        const characters = getCharacterList();
        fs.writeFileSync(manifestPath, JSON.stringify({ characters }, null, 2));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), characterManifestPlugin()],
})
