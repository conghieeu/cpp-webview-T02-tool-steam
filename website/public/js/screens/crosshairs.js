import { get, put, post, del } from "../api.js";

export function renderCrosshairs(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-1 mb-8">
      <h2 class="font-heading text-3xl font-bold uppercase tracking-wide">Crosshairs</h2>
      <p class="text-muted text-sm">Select, customize, and preview your reticle</p>
    </div>
    <div class="grid grid-cols-4 gap-4 max-w-[800px]" id="crosshairGrid"></div>
  `;

  loadGrid();
}

async function loadGrid() {
  const grid = document.getElementById("crosshairGrid");
  if (!grid) return;
  const items = await get("/crosshairs");

  grid.innerHTML = items
    .map(
      (c) => `
    <button class="crosshair-card w-[120px] h-[120px] bg-surface border ${c.is_active ? "border-primary shadow-[inset_0_0_15px_rgba(255,85,0,0.1)]" : "border-border hover:border-muted"} flex items-center justify-center cursor-pointer group" data-id="${c.id}">
      <svg class="${c.is_active ? "text-primary" : "text-text group-hover:text-primary transition-colors"} w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="${c.svg_d || "M12 2L2 12l10 10 10-10L12 2z"}"></path>
      </svg>
    </button>`
    )
    .join("");

  // Upload card
  grid.insertAdjacentHTML(
    "beforeend",
    `<button id="uploadCrosshair" class="w-[120px] h-[120px] bg-transparent border border-dashed border-border flex flex-col items-center justify-center hover:border-primary hover:text-primary text-muted cursor-pointer transition-colors group">
      <span class="material-symbols-outlined text-2xl mb-1 group-hover:scale-110 transition-transform">add</span>
      <span class="text-[10px] uppercase font-bold tracking-wider">Upload</span>
    </button>`
  );

  // Click to activate
  grid.querySelectorAll(".crosshair-card").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id, 10);
      await put(`/crosshairs/${id}/activate`);
      loadGrid();
    });
  });

  // Upload (prompt for simple SVG path)
  document.getElementById("uploadCrosshair")?.addEventListener("click", () => {
    const name = prompt("Crosshair name:", "Custom");
    if (!name) return;
    const svg_d = prompt("SVG path data (d attribute):", "M12 2v20M2 12h20");
    if (!svg_d) return;
    post("/crosshairs", { name, svg_d }).then(() => loadGrid());
  });
}
