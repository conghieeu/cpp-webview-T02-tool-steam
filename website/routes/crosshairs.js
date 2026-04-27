import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const items = db.prepare("SELECT * FROM crosshairs ORDER BY type, id").all();
  res.json(items);
});

router.post("/", (req, res) => {
  const { name, svg_d } = req.body;
  const r = db
    .prepare("INSERT INTO crosshairs (name, type, svg_d, is_active) VALUES (?, 'custom', ?, 0)")
    .run(name || "Custom", svg_d || "");
  const row = db.prepare("SELECT * FROM crosshairs WHERE id = ?").get(r.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id/activate", (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare("UPDATE crosshairs SET is_active = 0").run();
  db.prepare("UPDATE crosshairs SET is_active = 1 WHERE id = ?").run(id);
  const row = db.prepare("SELECT * FROM crosshairs WHERE id = ?").get(id);
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare("DELETE FROM crosshairs WHERE id = ? AND type = 'custom'").run(id);
  res.json({ ok: true });
});

export default router;
