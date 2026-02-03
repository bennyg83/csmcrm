#!/usr/bin/env node
/**
 * Builds a standalone bundle: frontend (with /api base URL) + backend serving it.
 * Output: backend/dist/ (run with NODE_ENV=production node backend/dist/index.js)
 * Frontend build is copied to backend/dist/public/
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");

console.log("Building frontend (VITE_API_URL=/api for same-origin)...");
execSync("npm run build", {
  cwd: path.join(root, "frontend"),
  env: { ...process.env, VITE_API_URL: "/api" },
  stdio: "inherit",
});

console.log("Building backend...");
execSync("npm run build", { cwd: path.join(root, "backend"), stdio: "inherit" });

const publicDir = path.join(root, "backend", "dist", "public");
const frontendDist = path.join(root, "frontend", "dist");
if (!fs.existsSync(frontendDist)) {
  console.error("Frontend dist not found at", frontendDist);
  process.exit(1);
}
if (fs.existsSync(publicDir)) fs.rmSync(publicDir, { recursive: true });
fs.cpSync(frontendDist, publicDir, { recursive: true });
console.log("Copied frontend build to backend/dist/public");

console.log("\nStandalone build done. Run:");
console.log("  set NODE_ENV=production && node backend/dist/index.js");
console.log("Then open http://localhost:3002 (or PORT in backend/.env; PostgreSQL must be running).");
