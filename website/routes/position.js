import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const row = db.prepare("SELECT * FROM positions ORDER BY id DESC LIMIT 1").get();
  res.json(row || { x_offset: 0, y_offset: 0, scale: 1.0 });
});

router.put("/", (req, res) => {
  const { x_offset, y_offset, scale } = req.body;
  const x = x_offset ?? 0;
  const y = y_offset ?? 0;
  const s = scale ?? 1.0;
  db.prepare("INSERT INTO positions (name, x_offset, y_offset, scale) VALUES (?, ?, ?, ?)").run("Current", x, y, s);
  const row = db.prepare("SELECT * FROM positions ORDER BY id DESC LIMIT 1").get();
  res.json(row);
});

router.post("/reset", (_req, res) => {
  db.prepare("INSERT INTO positions (name, x_offset, y_offset, scale) VALUES (?, ?, ?, ?)").run("Default", 0, 0, 1.0);
  const row = db.prepare("SELECT * FROM positions ORDER BY id DESC LIMIT 1").get();
  res.json(row);
});

export default router;
