/**
 * proxy-server.js
 * Minimal CORS proxy — forwards React app requests to the OpenAI API.
 * Keeps the API key server-side; the browser never sees it.
 *
 * Setup:
 *   npm install express http-proxy-middleware cors dotenv
 *
 * Run:
 *   node proxy-server.js
 *
 * .env must contain:
 *   OPENAI_API_KEY=sk-...
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌  Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

// Allow requests only from the React dev server
app.use(cors({ origin: "http://localhost:3000" }));

// Proxy /api/* → https://api.openai.com/*
app.use(
  "/api",
  createProxyMiddleware({
    target: "https://api.openai.com",
    changeOrigin: true,
    pathRewrite: { "^/api": "" }, // /api/v1/chat/completions → /v1/chat/completions
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader("Authorization", `Bearer ${API_KEY}`);
        proxyReq.setHeader("Content-Type", "application/json");
      },
    },
  })
);

app.listen(PORT, () => {
  console.log(`✅  OpenAI proxy running → http://localhost:${PORT}`);
  console.log(`   Forwarding /api/* to https://api.openai.com/*`);
});
