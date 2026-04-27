import { get, put, post } from "../api.js";

export function renderPositionSize(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-2 max-w-[800px] mb-8">
      <h3 class="font-heading text-xl font-bold uppercase tracking-wider">Overlay Calibration</h3>
      <p class="text-muted text-sm">Fine-tune the positioning and scaling of the tactical overlay relative to your primary display.</p>
    </div>
    <div class="flex flex-col gap-6 max-w-[800px]">
      <div class="bg-surface border border-border p-6 flex flex-col gap-4">
        <div class="flex justify-between items-center w-full">
          <div class="flex flex-col">
            <label class="font-heading text-base font-bold uppercase tracking-wide">X-Axis Offset</label>
            <span class="text-muted text-xs">Horizontal alignment from center</span>
          </div>
          <div class="bg-background-dark border border-border px-3 py-1 min-w-[60px] text-center">
            <span class="text-primary font-bold" id="xDisplay">0px</span>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-2">
          <span class="text-muted text-xs w-[40px] text-right">-100%</span>
          <div class="flex-1 relative h-6 flex items-center">
            <div class="absolute w-full h-[4px] bg-border-color"></div>
            <div class="absolute h-[4px] bg-primary left-0" id="xFill" style="width:50%"></div>
            <input type="range" id="xSlider" min="-100" max="100" value="0" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div class="absolute h-4 w-4 bg-text-main border border-border shadow-glow" id="xThumb" style="left:50%;transform:translateX(-50%)"></div>
          </div>
          <span class="text-muted text-xs w-[40px] text-left">+100%</span>
        </div>
      </div>
      <div class="bg-surface border border-border p-6 flex flex-col gap-4">
        <div class="flex justify-between items-center w-full">
          <div class="flex flex-col">
            <label class="font-heading text-base font-bold uppercase tracking-wide">Y-Axis Offset</label>
            <span class="text-muted text-xs">Vertical alignment from center</span>
          </div>
          <div class="bg-background-dark border border-border px-3 py-1 min-w-[60px] text-center">
            <span class="text-primary font-bold" id="yDisplay">0px</span>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-2">
          <span class="text-muted text-xs w-[40px] text-right">-100%</span>
          <div class="flex-1 relative h-6 flex items-center">
            <div class="absolute w-full h-[4px] bg-border-color"></div>
            <div class="absolute h-[4px] bg-primary left-0" id="yFill" style="width:50%"></div>
            <input type="range" id="ySlider" min="-100" max="100" value="0" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div class="absolute h-4 w-4 bg-text-main border border-border shadow-glow" id="yThumb" style="left:50%;transform:translateX(-50%)"></div>
          </div>
          <span class="text-muted text-xs w-[40px] text-left">+100%</span>
        </div>
      </div>
      <div class="bg-surface border border-border p-6 flex flex-col gap-4">
        <div class="flex justify-between items-center w-full">
          <div class="flex flex-col">
            <label class="font-heading text-base font-bold uppercase tracking-wide">Global Scale</label>
            <span class="text-muted text-xs">Overall size of the overlay elements</span>
          </div>
          <div class="bg-background-dark border border-border px-3 py-1 min-w-[60px] text-center">
            <span class="text-primary font-bold" id="scaleDisplay">1.0x</span>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-2">
          <span class="text-muted text-xs w-[40px] text-right">0.5x</span>
          <div class="flex-1 relative h-6 flex items-center">
            <div class="absolute w-full h-[4px] bg-border-color"></div>
            <div class="absolute h-[4px] bg-primary left-0" id="scaleFill" style="width:33%"></div>
            <input type="range" id="scaleSlider" min="0.5" max="2.0" step="0.1" value="1.0" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div class="absolute h-4 w-4 bg-text-main border border-border" id="scaleThumb" style="left:33%;transform:translateX(-50%)"></div>
          </div>
          <span class="text-muted text-xs w-[40px] text-left">2.0x</span>
        </div>
      </div>
      <div class="mt-4 flex flex-col gap-3">
        <label class="font-heading text-sm font-bold uppercase tracking-wide">Quick Align Presets</label>
        <div class="grid grid-cols-3 gap-4">
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider flex items-center justify-center gap-2" data-x="0" data-y="0">
            <span class="material-symbols-outlined text-lg">align_horizontal_center</span> Center All
          </button>
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider flex items-center justify-center gap-2" data-x="0" data-y="-100">
            <span class="material-symbols-outlined text-lg">vertical_align_top</span> Top Edge
          </button>
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider flex items-center justify-center gap-2" data-x="0" data-y="100">
            <span class="material-symbols-outlined text-lg">vertical_align_bottom</span> Bottom Edge
          </button>
        </div>
      </div>
      <div class="mt-8 flex justify-end gap-4 pt-6 border-t border-border">
        <button id="resetPosBtn" class="h-[40px] px-6 bg-transparent border border-border text-text-main hover:bg-surface-hover transition-colors font-heading uppercase font-bold tracking-wider text-sm">Reset to Default</button>
        <button id="applyPosBtn" class="h-[40px] w-[120px] bg-primary text-background-dark hover:brightness-125 transition-all font-heading uppercase font-bold tracking-wider text-base shadow-glow">Apply</button>
      </div>
    </div>
  `;

  // Wire sliders
  wireSlider("xSlider", "xThumb", "xFill", "xDisplay", "px", -100, 100, (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
  wireSlider("ySlider", "yThumb", "yFill", "yDisplay", "px", -100, 100, (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
  wireSlider("scaleSlider", "scaleThumb", "scaleFill", "scaleDisplay", "x", 0.5, 2.0, (v) => `${v}x`, (v) => `${((v - 0.5) / 1.5) * 100}%`);

  // Load saved
  get("/position").then((p) => {
    setSlider("xSlider", "xThumb", "xFill", "xDisplay", "px", p.x_offset, (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
    setSlider("ySlider", "yThumb", "yFill", "yDisplay", "px", p.y_offset, (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
    setSlider("scaleSlider", "scaleThumb", "scaleFill", "scaleDisplay", "x", p.scale, (v) => `${v}x`, (v) => `${((v - 0.5) / 1.5) * 100}%`);
  });

  // Align presets
  document.querySelectorAll(".align-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      setSlider("xSlider", "xThumb", "xFill", "xDisplay", "px", parseInt(btn.dataset.x, 10), (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
      setSlider("ySlider", "yThumb", "yFill", "yDisplay", "px", parseInt(btn.dataset.y, 10), (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
    });
  });

  // Reset
  document.getElementById("resetPosBtn").addEventListener("click", async () => {
    const p = await post("/position/reset");
    setSlider("xSlider", "xThumb", "xFill", "xDisplay", "px", p.x_offset, (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
    setSlider("ySlider", "yThumb", "yFill", "yDisplay", "px", p.y_offset, (v) => `${v}px`, (v) => `${(v + 100) / 2 * 100}%`);
    setSlider("scaleSlider", "scaleThumb", "scaleFill", "scaleDisplay", "x", p.scale, (v) => `${v}x`, (v) => `${((v - 0.5) / 1.5) * 100}%`);
  });

  // Apply
  document.getElementById("applyPosBtn").addEventListener("click", async () => {
    const x_offset = parseInt(document.getElementById("xSlider").value, 10);
    const y_offset = parseInt(document.getElementById("ySlider").value, 10);
    const scale = parseFloat(document.getElementById("scaleSlider").value);
    await put("/position", { x_offset, y_offset, scale });
  });
}

function wireSlider(sliderId, thumbId, fillId, displayId, suffix, min, max, fmt, pctFn) {
  const slider = document.getElementById(sliderId);
  slider.addEventListener("input", () => {
    const v = parseFloat(slider.value);
    setSliderUI(sliderId, thumbId, fillId, displayId, suffix, v, fmt, pctFn);
  });
}

function setSlider(sliderId, thumbId, fillId, displayId, suffix, val, fmt, pctFn) {
  document.getElementById(sliderId).value = val;
  setSliderUI(sliderId, thumbId, fillId, displayId, suffix, val, fmt, pctFn);
}

function setSliderUI(sliderId, thumbId, fillId, displayId, suffix, val, fmt, pctFn) {
  const pct = pctFn(val);
  document.getElementById(displayId).textContent = fmt(val);
  document.getElementById(fillId).style.width = pct;
  document.getElementById(thumbId).style.left = pct;
}
