import { get, put } from "../api.js";

export function renderDisplayModes(container) {
  container.innerHTML = `
    <div class="max-w-3xl flex flex-col gap-8 pb-20">
      <section class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">Rendering Mode</h2>
          <p class="text-sm text-muted">Select how the tactical overlay integrates with your game client.</p>
        </div>
        <div class="flex border border-border-color p-1 bg-surface" id="modeSelector">
          <label class="flex-1 text-center cursor-pointer">
            <input class="peer sr-only" type="radio" name="display-mode" value="fullscreen" />
            <div class="py-2 text-sm font-medium text-muted peer-checked:bg-primary peer-checked:text-background-dark transition-colors uppercase font-heading tracking-wide">Fullscreen</div>
          </label>
          <label class="flex-1 text-center cursor-pointer">
            <input class="peer sr-only" type="radio" name="display-mode" value="windowed" />
            <div class="py-2 text-sm font-medium text-muted peer-checked:bg-primary peer-checked:text-background-dark transition-colors uppercase font-heading tracking-wide">Windowed</div>
          </label>
          <label class="flex-1 text-center cursor-pointer">
            <input class="peer sr-only" type="radio" name="display-mode" value="overlay" />
            <div class="py-2 text-sm font-medium text-muted peer-checked:bg-primary peer-checked:text-background-dark transition-colors uppercase font-heading tracking-wide">Overlay</div>
          </label>
        </div>
      </section>
      <hr class="border-border-color" />
      <section class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">Target Resolution</h2>
          <p class="text-sm text-muted">Match this to your in-game resolution for accurate crosshair scaling.</p>
        </div>
        <div class="relative w-full max-w-md">
          <select id="resolutionSelect" class="w-full bg-surface border border-border-color text-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
            <option value="1920x1080">1920 x 1080 (Native)</option>
            <option value="2560x1440">2560 x 1440</option>
            <option value="3840x2160">3840 x 2160</option>
            <option value="1280x720">1280 x 720</option>
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
          <div class="relative w-full pt-2">
            <input type="range" id="fpsSlider" min="30" max="240" value="144" class="w-full" style="background:linear-gradient(to right,#FF5500 0%,#FF5500 var(--pct,57%),#2A2A35 var(--pct,57%),#2A2A35 100%);background-size:100% 4px;background-position:center;background-repeat:no-repeat" />
            <div class="flex justify-between text-xs text-muted mt-2"><span>30</span><span>240</span></div>
          </div>
        </div>
      </section>
    </div>
    <div class="sticky bottom-0 py-4 flex justify-end bg-gradient-to-t from-background-dark via-background-dark to-transparent pointer-events-none">
      <button id="applyDisplayBtn" class="pointer-events-auto w-[120px] h-[40px] bg-primary text-background-dark font-heading font-bold uppercase tracking-wide text-sm hover:brightness-110 transition-all border-none">Apply</button>
    </div>
  `;

  // Load current mode
  get("/display-modes").then((d) => {
    const radio = container.querySelector(`input[value="${d.mode}"]`);
    if (radio) radio.checked = true;
    container.querySelector("#resolutionSelect").value = d.resolution;
    const slider = container.querySelector("#fpsSlider");
    slider.value = d.framerate_cap;
    updateFpsDisplay(slider);
  });

  // Slider
  const slider = container.querySelector("#fpsSlider");
  slider.addEventListener("input", () => updateFpsDisplay(slider));

  // Apply
  container.querySelector("#applyDisplayBtn").addEventListener("click", async () => {
    const mode = container.querySelector("input[name='display-mode']:checked")?.value || "windowed";
    const resolution = container.querySelector("#resolutionSelect").value;
    const framerate_cap = parseInt(container.querySelector("#fpsSlider").value, 10);
    await put("/display-modes", { mode, resolution, framerate_cap });
    showFlash();
  });
}

function updateFpsDisplay(slider) {
  const val = parseInt(slider.value, 10);
  document.getElementById("fpsDisplay").textContent = `${val} FPS`;
  const pct = ((val - 30) / (240 - 30)) * 100;
  slider.style.setProperty("--pct", `${pct}%`);
}

function showFlash() {
  const el = document.getElementById("contentArea");
  el.style.transition = "background 0.15s";
  el.style.background = "rgba(255,85,0,0.08)";
  setTimeout(() => { el.style.background = ""; }, 200);
}
