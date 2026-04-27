#include <iostream>
#include <fstream>
#include <string>
#include <algorithm>
#define NOMINMAX
#include <windows.h>
#include <nlohmann/json.hpp>
#include "webview/webview.h"
#include "index_html.h"

using json = nlohmann::json;

static json config;

static std::string getConfigPath() {
    char path[MAX_PATH];
    GetModuleFileNameA(NULL, path, MAX_PATH);
    std::string exe(path);
    auto pos = exe.find_last_of("\\/");
    return exe.substr(0, pos) + "\\config.json";
}

static json defaultConfig() {
    return json{
        {"settings", {
            {"hidden", "false"},
            {"start_with_windows", "false"},
            {"hardware_acceleration", "false"},
            {"language", "en"}
        }},
        {"display_mode", {
            {"mode", "windowed"},
            {"resolution", "1920x1080"},
            {"framerate_cap", 144}
        }},
        {"crosshairs", json::array({
            {{"id", 1}, {"name", "Cross"}, {"type", "preset"}, {"svg_d", "M11 2v9H2v2h9v9h2v-9h9v-2h-9V2h-2z"}, {"is_active", 1}},
            {{"id", 2}, {"name", "Circle"}, {"type", "preset"}, {"svg_d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h4v2h-4v4h-2v-4H7v-2h4V7z"}, {"is_active", 0}},
            {{"id", 3}, {"name", "Dot"}, {"type", "preset"}, {"svg_d", "M12 8a4 4 0 100 8 4 4 0 000-8z"}, {"is_active", 0}},
            {{"id", 4}, {"name", "Diamond"}, {"type", "preset"}, {"svg_d", "M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5zM12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"}, {"is_active", 0}},
            {{"id", 5}, {"name", "Apex"}, {"type", "preset"}, {"svg_d", "M5 5l4 4m6-4l-4 4m4 10l-4-4m-6 4l4-4M12 11a1 1 0 100 2 1 1 0 000-2z"}, {"is_active", 0}},
            {{"id", 6}, {"name", "Tactical"}, {"type", "preset"}, {"svg_d", "M11 3v2h2V3h-2zM3 11v2h2v-2H3zm16 0v2h2v-2h-2zM11 19v2h2v-2h-2zM8 8l8 8M8 16l8-8M12 12"}, {"is_active", 0}}
        })},
        {"position", {
            {"x_offset", 0},
            {"y_offset", 0},
            {"scale", 1.0}
        }}
    };
}

static void saveConfig() {
    std::ofstream f(getConfigPath());
    f << config.dump(2);
}

static void loadConfig() {
    std::ifstream f(getConfigPath());
    if (f.is_open()) {
        try {
            config = json::parse(f);
            if (config.contains("settings") && config.contains("display_mode") &&
                config.contains("crosshairs") && config.contains("position")) {
                return;
            }
        } catch (...) {}
    }
    config = defaultConfig();
    saveConfig();
}

#ifdef _WIN32
int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
#else
int main() {
#endif
    try {
        loadConfig();

        webview::webview main_window(false, nullptr);
        main_window.set_title("Tactical HUD");
        main_window.set_size(1200, 720, WEBVIEW_HINT_NONE);

        main_window.bind("getData", [](const std::string&) -> std::string {
            return config.dump();
        });

        main_window.bind("saveSetting", [](const std::string& args_str) -> std::string {
            auto args = json::parse(args_str);
            std::string key = args[0];
            std::string value = args[1];

            if (key == "reset") {
                config = defaultConfig();
                saveConfig();
                return json({{"ok", true}}).dump();
            }

            config["settings"][key] = value;
            saveConfig();
            return json({{"ok", true}}).dump();
        });

        main_window.bind("saveDisplayMode", [](const std::string& args_str) -> std::string {
            auto args = json::parse(args_str);
            config["display_mode"] = json::parse(args[0].get<std::string>());
            saveConfig();
            return json({{"ok", true}}).dump();
        });

        main_window.bind("getCrosshairs", [](const std::string&) -> std::string {
            return config["crosshairs"].dump();
        });

        main_window.bind("activateCrosshair", [](const std::string& args_str) -> std::string {
            auto args = json::parse(args_str);
            int id = args[0];
            for (auto& c : config["crosshairs"]) {
                c["is_active"] = (c["id"] == id) ? 1 : 0;
            }
            saveConfig();
            return json({{"ok", true}}).dump();
        });

        main_window.bind("addCrosshair", [](const std::string& args_str) -> std::string {
            auto args = json::parse(args_str);
            std::string name = args[0];
            std::string svg_d = args[1];

            int maxId = 0;
            for (const auto& c : config["crosshairs"]) {
                maxId = std::max(maxId, c["id"].get<int>());
            }

            json ch = {{"id", maxId + 1}, {"name", name}, {"type", "custom"}, {"svg_d", svg_d}, {"is_active", 0}};
            config["crosshairs"].push_back(ch);
            saveConfig();
            return json({{"ok", true}, {"id", maxId + 1}}).dump();
        });

        main_window.bind("deleteCrosshair", [](const std::string& args_str) -> std::string {
            auto args = json::parse(args_str);
            int id = args[0];
            auto& crosshairs = config["crosshairs"];
            for (auto it = crosshairs.begin(); it != crosshairs.end(); ++it) {
                if ((*it)["id"] == id) {
                    crosshairs.erase(it);
                    break;
                }
            }
            saveConfig();
            return json({{"ok", true}}).dump();
        });

        main_window.bind("savePosition", [](const std::string& args_str) -> std::string {
            auto args = json::parse(args_str);
            config["position"] = json::parse(args[0].get<std::string>());
            saveConfig();
            return json({{"ok", true}}).dump();
        });

        main_window.bind("resetPosition", [](const std::string&) -> std::string {
            json pos = {{"x_offset", 0}, {"y_offset", 0}, {"scale", 1.0}};
            config["position"] = pos;
            saveConfig();
            return pos.dump();
        });

        main_window.set_html(INDEX_HTML);
        main_window.run();
    } catch (const webview::exception& e) {
        std::cerr << e.what() << '\n';
        return 1;
    }

    return 0;
}
