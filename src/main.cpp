#include <iostream>
#include "webview/webview.h"
#include "config_manager.h"
#include "bindings.h"
#include "index_html.h"

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

        webview::webview main_window(false, nullptr);
        main_window.set_title("Tactical HUD");
        main_window.set_size(1200, 720, WEBVIEW_HINT_NONE);

        registerBindings(main_window, config);

        main_window.set_html(INDEX_HTML);
        main_window.run();
    } catch (const webview::exception& e) {
        std::cerr << e.what() << '\n';
        return 1;
    }

    return 0;
}
