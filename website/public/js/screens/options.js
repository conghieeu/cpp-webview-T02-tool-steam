import { get, put, post } from "../api.js";

export function renderOptions(container) {
  container.innerHTML = `
    <div class="max-w-5xl mx-auto">
      <div class="mb-10">
        <h3 class="text-muted font-heading uppercase tracking-wider text-sm mb-6 border-b border-border pb-2">System Behaviors</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-surface border border-border p-5 flex items-center justify-between hover:border-muted transition-colors">
            <div class="flex flex-col pr-4">
              <span class="font-medium text-base mb-1">Start with Windows</span>
              <span class="text-muted text-sm">Automatically launch when system boots.</span>
            </div>
            <button class="toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border transition-colors duration-200 focus:outline-none" data-key="start_with_windows" role="switch">
              <span class="toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm shadow ring-0 transition duration-200"></span>
            </button>
          </div>
          <div class="bg-surface border border-border p-5 flex items-center justify-between hover:border-muted transition-colors">
            <div class="flex flex-col pr-4">
              <span class="font-medium text-base mb-1">Hardware Acceleration</span>
              <span class="text-muted text-sm">Use GPU to render interface. May improve performance.</span>
            </div>
            <button class="toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border transition-colors duration-200 focus:outline-none" data-key="hardware_acceleration" role="switch">
              <span class="toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm shadow ring-0 transition duration-200"></span>
            </button>
          </div>
        </div>
      </div>
      <div class="mb-10">
        <h3 class="text-muted font-heading uppercase tracking-wider text-sm mb-6 border-b border-border pb-2">Localization</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-surface border border-border p-5 flex flex-col justify-center hover:border-muted transition-colors">
            <label class="font-medium text-base mb-3" for="langSelect">Display Language</label>
            <div class="relative">
              <select id="langSelect" class="block w-full appearance-none border border-border bg-background-dark py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted">
                <span class="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-10 mt-16">
        <h3 class="text-danger font-heading uppercase tracking-wider text-sm mb-6 border-b border-danger/30 pb-2">Danger Zone</h3>
        <div class="bg-surface border border-danger/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex flex-col max-w-lg">
            <span class="font-medium text-base mb-1">Reset All Settings</span>
            <span class="text-muted text-sm">Permanently reset all configurations to factory defaults. This action cannot be undone.</span>
          </div>
          <button id="resetSettingsBtn" class="btn-danger shrink-0 inline-flex items-center justify-center px-6 py-2.5 font-heading uppercase tracking-widest text-base font-bold">Reset Defaults</button>
        </div>
      </div>
    </div>
  `;

  // Load settings
  get("/settings").then((s) => {
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      const key = btn.dataset.key;
      const val = s[key] === "true";
      applyToggleState(btn, val);
    });
    const lang = s.language || "en";
    const sel = container.querySelector("#langSelect");
    if (sel) sel.value = lang;
  });

  // Toggle clicks
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.key;
      const current = btn.classList.contains("bg-primary");
      const newVal = current ? "false" : "true";
      await put(`/settings/${key}`, { value: newVal });
      applyToggleState(btn, !current);
    });
  });

  // Language change
  container.querySelector("#langSelect")?.addEventListener("change", async (e) => {
    await put("/settings/language", { value: e.target.value });
  });

  // Reset
  container.querySelector("#resetSettingsBtn")?.addEventListener("click", async () => {
    if (!confirm("Reset all settings to defaults?")) return;
    const s = await post("/settings/reset");
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      applyToggleState(btn, s[btn.dataset.key] === "true");
    });
  });
}

function applyToggleState(btn, active) {
  if (active) {
    btn.className = "toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border border-primary bg-primary/20 transition-colors duration-200 focus:outline-none shadow-[inset_0_0_10px_rgba(249,87,6,0.2)] shadow-glow";
    btn.querySelector(".toggle-knob").className = "toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-primary shadow ring-0 transition duration-200 translate-x-5";
  } else {
    btn.className = "toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border border-border bg-background-dark transition-colors duration-200 focus:outline-none hover:border-muted";
    btn.querySelector(".toggle-knob").className = "toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-muted shadow ring-0 transition duration-200 translate-x-0";
  }
}
