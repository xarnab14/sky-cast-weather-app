/* ============================================================
   SkyCast — Vercel Serverless entry (api/index.js)

   Vercel wraps the exported Express app with the official
   adapter, so every /api/* route (weather proxy, search,
   AI brief, SkyArt) runs as a single serverless function.
   GEMINI_API_KEY is read from Vercel environment variables —
   never committed.
   ============================================================ */

import app from '../server/index.js';

export default async function handler(req, res) {
  return app(req, res);
}
