import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const row = db.prepare("SELECT * FROM display_modes ORDER BY id DESC LIMIT 1").get();
  res.json(row || { mode: "windowed", resolution: "1920x1080", framerate_cap: 144 });
});

router.put("/", (req, res) => {
  const { mode, resolution, framerate_cap } = req.body;
  const modeVal = mode || "windowed";
  const resVal = resolution || "1920x1080";
  const fps = framerate_cap ?? 144;
  db.prepare("INSERT INTO display_modes (mode, resolution, framerate_cap) VALUES (?, ?, ?)").run(modeVal, resVal, fps);
  const row = db.prepare("SELECT * FROM display_modes ORDER BY id DESC LIMIT 1").get();
  res.json(row);
});

export default router;
