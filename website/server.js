import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import settingsRouter from "./routes/settings.js";
import displayModesRouter from "./routes/display-modes.js";
import crosshairsRouter from "./routes/crosshairs.js";
import positionRouter from "./routes/position.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

app.use("/api/settings", settingsRouter);
app.use("/api/display-modes", displayModesRouter);
app.use("/api/crosshairs", crosshairsRouter);
app.use("/api/position", positionRouter);

app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Tactical Dark Web App running at http://localhost:${PORT}`);
});
