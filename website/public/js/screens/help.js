export function renderHelp(container) {
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
        ${renderFaq("How do I change my crosshair?", "Navigate to the \"Crosshairs\" section in the Essentials menu. Browse the gallery and click any card to instantly apply it. To upload a custom SVG, click the card with the \"+\" icon at the end of the gallery.")}
        ${renderFaq("Why isn't my display mode applying?", "Ensure you have clicked the \"APPLY\" button in the bottom right corner of the Display Modes screen. Some fullscreen exclusive games may require you to run Tactical in \"Overlay\" mode instead of \"Windowed\".")}
        ${renderFaq("How to reset all settings?", "Go to Customization > Options. Scroll to the bottom of the page and click the red \"RESET ALL SETTINGS\" button. Warning: This action cannot be undone.")}
        ${renderFaq("Is this app safe to use?", "Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files. It is compliant with standard anti-cheat systems. Always review the terms of service for specific competitive titles.")}
        ${renderFaq("How to change crosshair position?", "Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset. You can also click quick align presets like \"Center All\" to snap to predefined positions.")}
      </div>
      <div class="mt-8 bg-surface border border-border p-8 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-[#5865F2]/10 flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-[#5865F2] text-3xl">support_agent</span>
        </div>
        <h3 class="font-heading text-2xl mb-2">STILL NEED HELP?</h3>
        <p class="text-muted text-sm mb-6 max-w-md">Join our community server to speak with support staff or get configuration tips from other players.</p>
        <button class="bg-[#5865F2] hover:bg-[#4752C4] text-white font-heading text-lg px-8 py-3 transition-colors flex items-center gap-2">
          JOIN DISCORD SERVER
          <span class="material-symbols-outlined text-sm">open_in_new</span>
        </button>
      </div>
    </div>
  `;

  // Search filter
  document.getElementById("helpSearch")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".faq-item").forEach((el) => {
      const title = el.querySelector("summary span").textContent.toLowerCase();
      el.style.display = title.includes(q) ? "" : "none";
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
