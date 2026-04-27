import { renderDisplayModes } from "./screens/display-modes.js";
import { renderCrosshairs } from "./screens/crosshairs.js";
import { renderHelp } from "./screens/help.js";
import { renderOptions } from "./screens/options.js";
import { renderPositionSize } from "./screens/position-size.js";
import { get, put } from "./api.js";

const SCREENS = {
  "display-modes": { title: "Display Modes", render: renderDisplayModes },
  crosshairs: { title: "Crosshairs", render: renderCrosshairs },
  help: { title: "Help & Documentation", render: renderHelp },
  options: { title: "Options", render: renderOptions },
  "position-size": { title: "Position & Size", render: renderPositionSize },
};

// ─── Router ───

function navigate(screen) {
  if (!SCREENS[screen]) screen = "display-modes";

  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.screen === screen);
  });

  document.getElementById("pageTitle").textContent = SCREENS[screen].title;

  const content = document.getElementById("screenContent");
  SCREENS[screen].render(content);

  window.location.hash = screen;
}

// ─── Init ───

document.addEventListener("DOMContentLoaded", () => {
  // Warning dismiss
  document.getElementById("dismissWarning").addEventListener("click", () => {
    const banner = document.getElementById("warningBanner");
    banner.style.opacity = "0";
    banner.style.maxHeight = "0";
    banner.style.margin = "0";
    banner.style.padding = "0";
    banner.style.overflow = "hidden";
    setTimeout(() => banner.remove(), 300);
  });

  // Hidden toggle
  const hiddenToggle = document.getElementById("hiddenToggle");
  get("/settings").then((s) => {
    hiddenToggle.checked = s.hidden === "true";
  });
  hiddenToggle.addEventListener("change", () => {
    put("/settings/hidden", { value: String(hiddenToggle.checked) });
  });

  // Nav clicks
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(a.dataset.screen);
    });
  });

  // Hash routing
  window.addEventListener("hashchange", () => {
    const screen = window.location.hash.replace("#", "") || "display-modes";
    navigate(screen);
  });

  // Default screen
  const initial = window.location.hash.replace("#", "") || "display-modes";
  navigate(initial);
});
