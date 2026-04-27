import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

router.put("/:key", (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, String(value));
  res.json({ key, value });
});

router.post("/reset", (_req, res) => {
  db.prepare("DELETE FROM settings").run();
  const defaults = [
    ["hidden", "false"],
    ["start_with_windows", "false"],
    ["hardware_acceleration", "false"],
    ["language", "en"],
  ];
  const ins = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const d of defaults) ins.run(d[0], d[1]);
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

export default router;
