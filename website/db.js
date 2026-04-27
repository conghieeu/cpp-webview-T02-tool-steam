import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "data.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS display_modes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    mode           TEXT NOT NULL DEFAULT 'windowed',
    resolution     TEXT NOT NULL DEFAULT '1920x1080',
    framerate_cap  INTEGER NOT NULL DEFAULT 144
  );

  CREATE TABLE IF NOT EXISTS crosshairs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    type      TEXT NOT NULL DEFAULT 'preset',
    svg_d     TEXT,
    is_active INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS positions (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    x_offset INTEGER NOT NULL DEFAULT 0,
    y_offset INTEGER NOT NULL DEFAULT 0,
    scale    REAL NOT NULL DEFAULT 1.0
  );
`);

// Seed defaults
const settingCount = db.prepare("SELECT COUNT(*) as c FROM settings").get().c;
if (settingCount === 0) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("hidden", "false");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("start_with_windows", "false");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("hardware_acceleration", "false");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("language", "en");
}

const modeCount = db.prepare("SELECT COUNT(*) as c FROM display_modes").get().c;
if (modeCount === 0) {
  db.prepare("INSERT INTO display_modes (mode, resolution, framerate_cap) VALUES (?, ?, ?)").run("windowed", "1920x1080", 144);
}

const crosshairCount = db.prepare("SELECT COUNT(*) as c FROM crosshairs").get().c;
if (crosshairCount === 0) {
  const presets = [
    { name: "Cross",       svg: "M11 2v9H2v2h9v9h2v-9h9v-2h-9V2h-2z" },
    { name: "Circle",      svg: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h4v2h-4v4h-2v-4H7v-2h4V7z" },
    { name: "Dot",         svg: "M12 8a4 4 0 100 8 4 4 0 000-8z" },
    { name: "Diamond",     svg: "M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5zM12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" },
    { name: "Apex",        svg: "M5 5l4 4m6-4l-4 4m4 10l-4-4m-6 4l4-4M12 11a1 1 0 100 2 1 1 0 000-2z" },
    { name: "Tactical",    svg: "M11 3v2h2V3h-2zM3 11v2h2v-2H3zm16 0v2h2v-2h-2zM11 19v2h2v-2h-2zM8 8l8 8M8 16l8-8M12 12" },
  ];
  const insert = db.prepare("INSERT INTO crosshairs (name, type, svg_d, is_active) VALUES (?, 'preset', ?, ?)");
  presets.forEach((p, i) => insert.run(p.name, p.svg, i === 0 ? 1 : 0));
}

const posCount = db.prepare("SELECT COUNT(*) as c FROM positions").get().c;
if (posCount === 0) {
  db.prepare("INSERT INTO positions (name, x_offset, y_offset, scale) VALUES (?, ?, ?, ?)").run("Default", 0, 0, 1.0);
}

export default db;
