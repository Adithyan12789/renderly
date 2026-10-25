# Renderly — Frontend

Standalone React 19 + Vite 8 client application for the Renderly 3D rendering suite.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
- In development, `VITE_API_URL` can remain unset to use the built-in Vite proxy (`/api` -> `http://localhost:4000`).

### 3. Run Development Server
```bash
pnpm run dev
```
The application will be running at `http://localhost:3000`.

---

## 🛠️ Scripts

- `pnpm run dev`: Starts local Vite dev server with Hot Module Replacement (HMR).
- `pnpm run build`: Type-checks and creates an optimized production bundle in `dist/`.
- `pnpm run preview`: Previews the production build locally.
- `pnpm run typecheck`: Validates TypeScript types across the frontend.
