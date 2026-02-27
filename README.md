# Mirror World Runner

A 3D cyber-neon endless runner prototype built with **React + TypeScript + Vite + React Three Fiber**.

## Tech Stack
- React 19 + TypeScript
- Vite
- Three.js / React Three Fiber / Drei
- Zustand (game state)

## Prerequisites
- Node.js 20+ (or latest LTS)
- pnpm (via Corepack)

## Install
```bash
pnpm install
```

## Run Dev Server
Start local development server:

```bash
pnpm dev
```

By default, Vite runs on `http://localhost:5173`.

To force a specific host/port:

```bash
pnpm dev -- --host 0.0.0.0 --port 5173
```

## Build Final App (Production)
Create an optimized production build:

```bash
pnpm build
```

Build output is generated in the `dist/` folder.

## Preview Production Build Locally
```bash
pnpm preview
```

## Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Type-check and build production bundle
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
