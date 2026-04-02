const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || "";

// In-memory store (swap to Supabase later)
let store = { _names: {} };

app.use(express.json());
app.use(express.static("public"));

app.get("/api/data/:year", (req, res) => {
  res.json(store[req.params.year] || {});
});

app.post("/api/data/:year", (req, res) => {
  store[req.params.year] = req.body;
  res.json({ ok: true });
});

app.get("/api/names", (req, res) => {
  res.json(store._names || {});
});

app.post("/api/names", (req, res) => {
  store._names = req.body;
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// Keep alive - ping self every 14 min to prevent Render sleep
setInterval(() => {
  const url = RENDER_URL || ("http://localhost:" + PORT);
  fetch(url + "/api/health").catch(() => {});
}, 14 * 60 * 1000);

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  if (RENDER_URL) console.log("External: " + RENDER_URL);
});