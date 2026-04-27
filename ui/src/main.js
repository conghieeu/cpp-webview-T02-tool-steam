// ─── C++ Native Bridge ───

const Native = {
  async call(method, ...args) {
    try {
      const raw = await window[method](...args);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  getData() { return this.call("getData"); },
  saveSetting(key, value) { return this.call("saveSetting", key, value); },
  saveDisplayMode(obj) { return this.call("saveDisplayMode", JSON.stringify(obj)); },
  getCrosshairs() { return this.call("getCrosshairs"); },
  activateCrosshair(id) { return this.call("activateCrosshair", id); },
  addCrosshair(name, svgD) { return this.call("addCrosshair", name, svgD); },
  deleteCrosshair(id) { return this.call("deleteCrosshair", id); },
  savePosition(obj) { return this.call("savePosition", JSON.stringify(obj)); },
  resetPosition() { return this.call("resetPosition"); },
};

// ─── State ───

let appData = null;

// ─── Router ───

const SCREENS = {
  "display-modes": { title: "Display Modes", render: renderDisplayModes },
  crosshairs: { title: "Crosshairs", render: renderCrosshairs },
  "position-size": { title: "Position & Size", render: renderPositionSize },
  options: { title: "Options", render: renderOptions },
  help: { title: "Help & Documentation", render: renderHelp },
};

function navigate(screen) {
  if (!SCREENS[screen]) screen = "display-modes";
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.screen === screen);
  });
  document.getElementById("pageTitle").textContent = SCREENS[screen].title;
  SCREENS[screen].render(document.getElementById("screenContent"));
}

// ─── Display Modes Screen ───

function renderDisplayModes(container) {
  container.innerHTML = `
    <div class="max-w-3xl flex flex-col gap-8 pb-20">
      <section class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">Rendering Mode</h2>
          <p class="text-sm text-muted">Select how the tactical overlay integrates with your game client.</p>
        </div>
        <div class="flex border border-border-color p-1 bg-surface" id="modeSelector">
          ${["fullscreen", "windowed", "overlay"].map((m) => `
            <label class="flex-1 text-center cursor-pointer">
              <input class="peer sr-only" type="radio" name="display-mode" value="${m}" />
              <div class="py-2 text-sm font-medium text-muted peer-checked:bg-primary peer-checked:text-background-dark transition-colors uppercase font-heading tracking-wide">${m.charAt(0).toUpperCase() + m.slice(1)}</div>
            </label>`).join("")}
        </div>
      </section>
      <hr class="border-border-color" />
      <section class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">Target Resolution</h2>
          <p class="text-sm text-muted">Match this to your in-game resolution.</p>
        </div>
        <div class="relative w-full max-w-md">
          <select id="resolutionSelect" class="w-full bg-surface border border-border-color text-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
            ${["1920x1080 (Native)", "2560x1440", "3840x2160", "1280x720"].map((r) => `<option value="${r.split(" ")[0]}">${r}</option>`).join("")}
          </select>
        </div>
      </section>
      <hr class="border-border-color" />
      <section class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">Performance</h2>
          <p class="text-sm text-muted">Limit overlay framerate to conserve GPU resources.</p>
        </div>
        <div class="flex flex-col gap-4 max-w-md">
          <div class="flex justify-between items-center">
            <label class="text-sm">Framerate Cap</label>
            <span class="text-sm font-heading font-bold text-primary" id="fpsDisplay">144 FPS</span>
          </div>
          <input type="range" id="fpsSlider" min="30" max="240" value="144" class="w-full" />
          <div class="flex justify-between text-xs text-muted"><span>30</span><span>240</span></div>
        </div>
      </section>
    </div>
    <div class="sticky bottom-0 py-4 flex justify-end bg-gradient-to-t from-background-dark via-background-dark to-transparent">
      <button id="applyDisplayBtn" class="w-[120px] h-[40px] bg-primary text-background-dark font-heading font-bold uppercase tracking-wide text-sm hover:brightness-110 transition-all border-none cursor-pointer">Apply</button>
    </div>`;

  if (appData?.display_mode) {
    const d = appData.display_mode;
    const radio = container.querySelector(`input[value="${d.mode}"]`);
    if (radio) radio.checked = true;
    container.querySelector("#resolutionSelect").value = d.resolution;
    container.querySelector("#fpsSlider").value = d.framerate_cap;
    container.querySelector("#fpsDisplay").textContent = d.framerate_cap + " FPS";
  }

  container.querySelector("#fpsSlider").addEventListener("input", (e) => {
    container.querySelector("#fpsDisplay").textContent = e.target.value + " FPS";
  });

  container.querySelector("#applyDisplayBtn").addEventListener("click", async () => {
    const mode = container.querySelector("input[name='display-mode']:checked")?.value || "windowed";
    const resolution = container.querySelector("#resolutionSelect").value;
    const framerate_cap = parseInt(container.querySelector("#fpsSlider").value, 10);
    appData.display_mode = { mode, resolution, framerate_cap };
    await Native.saveDisplayMode({ mode, resolution, framerate_cap });
    const el = document.getElementById("contentArea");
    el.style.transition = "background 0.15s";
    el.style.background = "rgba(255,85,0,0.08)";
    setTimeout(() => { el.style.background = ""; }, 200);
  });
}

// ─── Crosshairs Screen ───

function renderCrosshairs(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-1 mb-8">
      <h2 class="font-heading text-3xl font-bold uppercase tracking-wide">Crosshairs</h2>
      <p class="text-muted text-sm">Select, customize, and preview your reticle</p>
    </div>
    <div class="grid grid-cols-4 gap-4 max-w-[800px]" id="crosshairGrid"></div>`;

  loadCrosshairGrid();
}

async function loadCrosshairGrid() {
  const grid = document.getElementById("crosshairGrid");
  if (!grid) return;
  const items = appData?.crosshairs || await Native.getCrosshairs() || [];
  if (!appData) appData = {};
  appData.crosshairs = items;

  grid.innerHTML = items.map((c) => `
    <button class="crosshair-card w-[120px] h-[120px] bg-surface border ${c.is_active ? "border-primary shadow-[inset_0_0_15px_rgba(255,85,0,0.1)]" : "border-border hover:border-muted"} flex items-center justify-center cursor-pointer group" data-id="${c.id}">
      <svg class="${c.is_active ? "text-primary" : "text-text group-hover:text-primary transition-colors"} w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="${c.svg_d || "M12 2L2 12l10 10 10-10L12 2z"}"></path></svg>
    </button>`).join("") + `
    <button id="uploadCrosshair" class="w-[120px] h-[120px] bg-transparent border border-dashed border-border flex flex-col items-center justify-center hover:border-primary hover:text-primary text-muted cursor-pointer transition-colors group">
      <span class="material-symbols-outlined text-2xl mb-1 group-hover:scale-110 transition-transform">add</span>
      <span class="text-[10px] uppercase font-bold tracking-wider">Upload</span>
    </button>`;

  grid.querySelectorAll(".crosshair-card").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id, 10);
      const result = await Native.activateCrosshair(id);
      if (result) {
        for (const c of appData.crosshairs) c.is_active = c.id === id ? 1 : 0;
        loadCrosshairGrid();
      }
    });
  });

  document.getElementById("uploadCrosshair")?.addEventListener("click", () => {
    const name = prompt("Crosshair name:", "Custom");
    if (!name) return;
    const svg_d = prompt("SVG path data (d attribute):", "M12 2v20M2 12h20");
    if (!svg_d) return;
    Native.addCrosshair(name, svg_d).then(() => {
      Native.getCrosshairs().then((items) => {
        appData.crosshairs = items;
        loadCrosshairGrid();
      });
    });
  });
}

// ─── Position & Size Screen ───

function renderPositionSize(container) {
  const pos = appData?.position || { x_offset: 0, y_offset: 0, scale: 1.0 };

  container.innerHTML = `
    <div class="flex flex-col gap-2 max-w-[800px] mb-8">
      <h3 class="font-heading text-xl font-bold uppercase tracking-wider">Overlay Calibration</h3>
      <p class="text-muted text-sm">Fine-tune the positioning and scaling relative to your primary display.</p>
    </div>
    <div class="flex flex-col gap-6 max-w-[800px]">
      ${renderAxisSlider("X-Axis Offset", "Horizontal alignment from center", "xSlider", "xDisplay", "px", pos.x_offset, -100, 100)}
      ${renderAxisSlider("Y-Axis Offset", "Vertical alignment from center", "ySlider", "yDisplay", "px", pos.y_offset, -100, 100)}
      ${renderAxisSlider("Global Scale", "Overall size of the overlay elements", "scaleSlider", "scaleDisplay", "x", pos.scale, 0.5, 2.0, 0.1)}
      <div class="mt-4 flex flex-col gap-3">
        <label class="font-heading text-sm font-bold uppercase tracking-wide">Quick Align Presets</label>
        <div class="grid grid-cols-3 gap-4">
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider" data-x="0" data-y="0">Center All</button>
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider" data-x="0" data-y="-100">Top Edge</button>
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider" data-x="0" data-y="100">Bottom Edge</button>
        </div>
      </div>
      <div class="mt-8 flex justify-end gap-4 pt-6 border-t border-border">
        <button id="resetPosBtn" class="h-[40px] px-6 bg-transparent border border-border text-text-main hover:bg-surface-hover transition-colors font-heading uppercase font-bold tracking-wider text-sm cursor-pointer">Reset to Default</button>
        <button id="applyPosBtn" class="h-[40px] w-[120px] bg-primary text-background-dark hover:brightness-125 transition-all font-heading uppercase font-bold tracking-wider text-base shadow-glow cursor-pointer">Apply</button>
      </div>
    </div>`;

  wireSlider("xSlider", "xDisplay", "px");
  wireSlider("ySlider", "yDisplay", "px");
  wireSlider("scaleSlider", "scaleDisplay", "x");

  document.querySelectorAll(".align-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("xSlider").value = btn.dataset.x;
      document.getElementById("ySlider").value = btn.dataset.y;
      updateSliderDisplay("xSlider", "xDisplay", "px");
      updateSliderDisplay("ySlider", "yDisplay", "px");
    });
  });

  document.getElementById("resetPosBtn").addEventListener("click", async () => {
    const r = await Native.resetPosition();
    if (r) {
      document.getElementById("xSlider").value = r.x_offset;
      document.getElementById("ySlider").value = r.y_offset;
      document.getElementById("scaleSlider").value = r.scale;
      updateSliderDisplay("xSlider", "xDisplay", "px");
      updateSliderDisplay("ySlider", "yDisplay", "px");
      updateSliderDisplay("scaleSlider", "scaleDisplay", "x");
    }
  });

  document.getElementById("applyPosBtn").addEventListener("click", async () => {
    const posData = {
      x_offset: parseInt(document.getElementById("xSlider").value, 10),
      y_offset: parseInt(document.getElementById("ySlider").value, 10),
      scale: parseFloat(document.getElementById("scaleSlider").value),
    };
    appData.position = posData;
    await Native.savePosition(posData);
  });
}

function renderAxisSlider(label, desc, sliderId, displayId, suffix, val, min, max, step) {
  step = step || 1;
  const pct = ((val - min) / (max - min)) * 100;
  const displayVal = suffix === "x" ? val + "x" : val + suffix;
  return `<div class="bg-surface border border-border p-6 flex flex-col gap-4">
    <div class="flex justify-between items-center w-full">
      <div class="flex flex-col">
        <label class="font-heading text-base font-bold uppercase tracking-wide">${label}</label>
        <span class="text-muted text-xs">${desc}</span>
      </div>
      <div class="bg-background-dark border border-border px-3 py-1 min-w-[60px] text-center">
        <span class="text-primary font-bold" id="${displayId}">${displayVal}</span>
      </div>
    </div>
    <div class="flex items-center gap-4 mt-2">
      <span class="text-muted text-xs">${min}</span>
      <div class="flex-1 relative h-6 flex items-center">
        <div class="absolute w-full h-[4px] bg-border-color"></div>
        <div class="absolute h-[4px] bg-primary left-0" id="${sliderId}Fill" style="width:${pct}%"></div>
        <input type="range" id="${sliderId}" min="${min}" max="${max}" step="${step}" value="${val}" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div class="absolute h-4 w-4 bg-text-main border border-border shadow-glow" id="${sliderId}Thumb" style="left:${pct}%;transform:translateX(-50%)"></div>
      </div>
      <span class="text-muted text-xs">${max}</span>
    </div>
  </div>`;
}

function wireSlider(sliderId, displayId, suffix) {
  const slider = document.getElementById(sliderId);
  slider.addEventListener("input", () => updateSliderDisplay(sliderId, displayId, suffix));
}

function updateSliderDisplay(sliderId, displayId, suffix) {
  const slider = document.getElementById(sliderId);
  const val = parseFloat(slider.value);
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const pct = ((val - min) / (max - min)) * 100;
  document.getElementById(displayId).textContent = suffix === "x" ? val + "x" : val + suffix;
  const fill = document.getElementById(sliderId + "Fill");
  if (fill) fill.style.width = pct + "%";
  const thumb = document.getElementById(sliderId + "Thumb");
  if (thumb) thumb.style.left = pct + "%";
}

// ─── Options Screen ───

function renderOptions(container) {
  const s = appData?.settings || {};

  container.innerHTML = `
    <div class="max-w-5xl mx-auto">
      <div class="mb-10">
        <h3 class="text-muted font-heading uppercase tracking-wider text-sm mb-6 border-b border-border pb-2">System Behaviors</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${renderToggleCard("Start with Windows", "Automatically launch when system boots.", "start_with_windows", s.start_with_windows === "true")}
          ${renderToggleCard("Hardware Acceleration", "Use GPU to render interface.", "hardware_acceleration", s.hardware_acceleration === "true")}
        </div>
      </div>
      <div class="mb-10">
        <h3 class="text-muted font-heading uppercase tracking-wider text-sm mb-6 border-b border-border pb-2">Localization</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-surface border border-border p-5 flex flex-col justify-center hover:border-muted transition-colors">
            <label class="font-medium text-base mb-3">Display Language</label>
            <div class="relative">
              <select id="langSelect" class="block w-full appearance-none border border-border bg-background-dark py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
                ${[["en", "English (US)"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["ja", "日本語"]].map(([v, l]) => `<option value="${v}" ${s.language === v ? "selected" : ""}>${l}</option>`).join("")}
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted"><span class="material-symbols-outlined text-[20px]">expand_more</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-10 mt-16">
        <h3 class="text-danger font-heading uppercase tracking-wider text-sm mb-6 border-b border-danger/30 pb-2">Danger Zone</h3>
        <div class="bg-surface border border-danger/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex flex-col max-w-lg">
            <span class="font-medium text-base mb-1">Reset All Settings</span>
            <span class="text-muted text-sm">Permanently reset all configurations to factory defaults.</span>
          </div>
          <button id="resetSettingsBtn" class="btn-danger shrink-0 inline-flex items-center justify-center px-6 py-2.5 font-heading uppercase tracking-widest text-base font-bold cursor-pointer">Reset Defaults</button>
        </div>
      </div>
    </div>`;

  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.key;
      const active = btn.classList.contains("bg-primary");
      const newVal = active ? "false" : "true";
      await Native.saveSetting(key, newVal);
      if (appData?.settings) appData.settings[key] = newVal;
      applyToggleState(btn, !active);
    });
  });

  document.getElementById("langSelect")?.addEventListener("change", async (e) => {
    await Native.saveSetting("language", e.target.value);
    if (appData?.settings) appData.settings.language = e.target.value;
  });

  document.getElementById("resetSettingsBtn")?.addEventListener("click", async () => {
    if (!confirm("Reset all settings to defaults?")) return;
    await Native.saveSetting("reset", "true");
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      applyToggleState(btn, btn.dataset.key === "hidden");
    });
  });
}

function renderToggleCard(title, desc, key, active) {
  return `<div class="bg-surface border border-border p-5 flex items-center justify-between hover:border-muted transition-colors">
    <div class="flex flex-col pr-4">
      <span class="font-medium text-base mb-1">${title}</span>
      <span class="text-muted text-sm">${desc}</span>
    </div>
    <button class="toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border transition-colors duration-200 focus:outline-none ${active ? "border-primary bg-primary/20 shadow-[inset_0_0_10px_rgba(249,87,6,0.2)] shadow-glow" : "border-border bg-background-dark hover:border-muted"}" data-key="${key}" role="switch">
      <span class="toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm shadow ring-0 transition duration-200 ${active ? "translate-x-5 bg-primary" : "translate-x-0 bg-muted"}"></span>
    </button>
  </div>`;
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

// ─── Help Screen ───

function renderHelp(container) {
  container.innerHTML = `
    <div class="max-w-[800px] mx-auto w-full flex flex-col gap-8 pb-12">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span class="material-symbols-outlined text-muted">search</span>
        </div>
        <input class="w-full h-12 pl-12 pr-4 bg-surface border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted" placeholder="SEARCH DOCUMENTATION..." type="text" id="helpSearch" />
      </div>
      <div class="flex flex-col gap-2" id="faqList">
        <h3 class="font-heading text-xl text-muted mb-2 border-b border-border pb-2">FREQUENTLY ASKED QUESTIONS</h3>
        ${renderFaq("How do I change my crosshair?", "Navigate to the Crosshairs section in the Essentials menu. Browse the gallery and click any card to instantly apply it.")}
        ${renderFaq("Why isn't my display mode applying?", 'Ensure you have clicked the "APPLY" button in the bottom right corner of the Display Modes screen.')}
        ${renderFaq("How to reset all settings?", "Go to Customization > Options. Scroll to the bottom and click the red RESET ALL SETTINGS button. This cannot be undone.")}
        ${renderFaq("Is this app safe to use?", "Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files.")}
        ${renderFaq("How to change crosshair position?", "Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset.")}
      </div>
      <div class="mt-8 bg-surface border border-border p-8 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-[#5865F2]/10 flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-[#5865F2] text-3xl">support_agent</span>
        </div>
        <h3 class="font-heading text-2xl mb-2">STILL NEED HELP?</h3>
        <p class="text-muted text-sm mb-6 max-w-md">Join our community server for support and configuration tips.</p>
        <button class="bg-[#5865F2] hover:bg-[#4752C4] text-white font-heading text-lg px-8 py-3 transition-colors flex items-center gap-2 cursor-pointer">
          JOIN DISCORD SERVER <span class="material-symbols-outlined text-sm">open_in_new</span>
        </button>
      </div>
    </div>`;

  document.getElementById("helpSearch")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".faq-item").forEach((el) => {
      el.style.display = el.querySelector("summary span").textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

function renderFaq(question, answer) {
  return `<details class="faq-item group bg-surface border border-border">
    <summary class="flex items-center justify-between h-14 px-4 cursor-pointer hover:bg-surface-hover transition-colors">
      <span class="font-medium text-text-main text-sm">${question}</span>
      <span class="material-symbols-outlined text-muted group-open:rotate-45 transition-transform duration-200">add</span>
    </summary>
    <div class="px-4 pb-4 pt-2 text-sm text-muted border-t border-border/50">${answer}</div>
  </details>`;
}

// ─── Init ───

document.addEventListener("DOMContentLoaded", async () => {
  // Load data from C++
  appData = await Native.getData();

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
  if (appData?.settings) {
    hiddenToggle.checked = appData.settings.hidden === "true";
  }
  hiddenToggle.addEventListener("change", () => {
    Native.saveSetting("hidden", String(hiddenToggle.checked));
    if (appData?.settings) appData.settings.hidden = String(hiddenToggle.checked);
  });

  // Nav clicks
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.addEventListener("click", () => navigate(a.dataset.screen));
  });

  // Default screen
  navigate("display-modes");
});
