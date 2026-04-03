const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || "";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(express.json());
app.use(express.static("public"));

app.get("/api/data/:year", async (req, res) => {
  const { data, error } = await supabase
    .from("events").select("id, day, value")
    .eq("year", parseInt(req.params.year))
    .order("id");
  if (error) return res.status(500).json({ error: error.message });
  const result = {};
  data.forEach(r => {
    if (!result[r.day]) result[r.day] = [];
    result[r.day].push({ id: r.id, value: r.value });
  });
  res.json(result);
});

app.post("/api/event", async (req, res) => {
  const { year, day, value } = req.body;
  const { count } = await supabase
    .from("events").select("id", { count: "exact", head: true })
    .eq("year", year).eq("day", day);
  if (count >= 3) return res.status(400).json({ error: "Max 3 per day" });
  const { data, error } = await supabase
    .from("events").insert({ year, day, value }).select("id").single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id: data.id });
});

app.delete("/api/event/:id", async (req, res) => {
  const { error } = await supabase
    .from("events").delete()
    .eq("id", parseInt(req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get("/api/names", async (req, res) => {
  const { data, error } = await supabase
    .from("config").select("value")
    .eq("key", "names").single();
  if (error) return res.json({ blue: "", gold: "" });
  res.json(data.value);
});

app.post("/api/names", async (req, res) => {
  const { error } = await supabase
    .from("config").upsert({ key: "names", value: req.body }, { onConflict: "key" });
  if (error) return res.status(500).json({ error: error.message });
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