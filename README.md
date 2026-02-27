# Mirror World Runner

A 3D cyber-neon endless runner prototype built with **React + TypeScript + Vite + React Three Fiber**.

## Tech Stack
- React 19 + TypeScript
- Vite
- Three.js / React Three Fiber / Drei
- Zustand (game state)

## Prerequisites
- Node.js 20+ (or latest LTS)
- npm

## Install
```bash
npm install
```

## Run Dev Server
Start local development server:

```bash
npm run dev
```

By default, Vite runs on `http://localhost:5173`.

To force a specific host/port:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## Build Final App (Production)
Create an optimized production build:

```bash
npm run build
```

Build output is generated in the `dist/` folder.

## Preview Production Build Locally
```bash
npm run preview
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Type-check and build production bundle
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
