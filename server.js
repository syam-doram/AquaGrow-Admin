/**
 * server.js — Production static file server for Render
 * Serves the Vite-built `dist/` folder on process.env.PORT.
 * All unknown routes return index.html so React Router works.
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4173;

// Serve static files from dist/
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — all routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AquaGrow Admin] Serving on http://0.0.0.0:${PORT}`);
});
