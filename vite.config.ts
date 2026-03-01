import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function characterManifestPlugin() {
  return {
    name: 'character-manifest',
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use(
        '/models/characters/manifest.json',
        (_req: unknown, res: { setHeader: Function; end: Function }) => {
          const dir = path.join(process.cwd(), 'public/models/characters');
          try {
            const files = fs.readdirSync(dir).filter((f: string) =>
              f.toLowerCase().endsWith('.fbx'),
            );
            const characters = files.map((f: string) => ({
              name: f.replace(/\.fbx$/i, ''),
              file: f,
            }));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ characters }));
          } catch {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ characters: [] }));
          }
        },
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), characterManifestPlugin()],
})
