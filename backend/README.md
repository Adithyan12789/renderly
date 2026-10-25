# Renderly — Backend API

Standalone Express 5 + TypeScript backend service with MongoDB and Zod validation.

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
Default configuration:
```env
NODE_ENV=development
PORT=4000
CLIENT_ORIGINS=http://localhost:3000
MONGODB_URI=mongodb+srv://...  # Optional in dev, required in production
```

### 3. Run Development Server
```bash
pnpm run dev
```
The server will be running at `http://localhost:4000` with hot reload via `tsx`.

---

## 🛠️ Scripts

- `pnpm run dev`: Starts the server with file watching and auto-restart.
- `pnpm run build`: Compiles TypeScript files into `dist/`.
- `pnpm start`: Runs the compiled production code from `dist/index.js`.
- `pnpm run typecheck`: Validates TypeScript types across the backend.
