#include <iostream>
#include "webview/webview.h"
#include "config_manager.h"
#include "bindings.h"
#include "index_html.h"
#include "overlay_manager.h"

#ifdef _WIN32
int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
#else
int main() {
#endif
    try {
        ConfigManager config;
        if (!config.load()) {
            config.resetToDefaults();
        }

        OverlayManager overlay;
        if (!overlay.start()) {
            std::cerr << "Failed to start overlay process\n";
        }

        webview::webview main_window(false, nullptr);
        main_window.set_title("Tactical HUD");
        main_window.set_size(1200, 720, WEBVIEW_HINT_NONE);

        registerBindings(main_window, config, overlay);
        
        // Initial sync to overlay
        auto syncOverlay = [&config, &overlay]() {
            json state;
            auto configData = config.getConfig();
            state["mode"] = configData["display_mode"]["mode"];
            state["position"] = configData["position"];
            state["hidden"] = configData["settings"]["hidden"];

            std::string activeSvg = "";
            for (auto& c : configData["crosshairs"]) {
                if (c["is_active"] == 1) {
                    activeSvg = c["svg_d"].get<std::string>();
                    break;
                }
            }
            state["crosshair"] = activeSvg;
            overlay.sendUpdate(state);
        };
        syncOverlay();

        main_window.set_html(INDEX_HTML);
        main_window.run();
    } catch (const webview::exception& e) {
        std::cerr << e.what() << '\n';
        return 1;
    }

    return 0;
}
