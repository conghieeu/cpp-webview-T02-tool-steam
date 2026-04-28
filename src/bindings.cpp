#include "bindings.h"
#include "error_types.h"
#include "validation.h"
#include <iostream>

void registerBindings(webview::webview& w, ConfigManager& config, OverlayManager& overlay) {
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

    w.bind("getData", [&config](const std::string&) -> std::string {
        try {
            // Include supported_languages so frontend knows what's available
            json data = config.getConfig();
            data["supported_languages"] = ConfigManager::supportedLanguages();
            return data.dump();
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("getData failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "getData failed with unknown error");
        }
    });

    w.bind("saveSetting", [&config, syncOverlay](const std::string& args_str) -> std::string {
        try {
            auto args = json::parse(args_str);
            if (!args.is_array() || args.size() < 2 || !args[0].is_string()) {
                return makeError("INVALID_ARGUMENT",
                    "saveSetting requires 2 arguments: key (string) and value (string or boolean)");
            }

            std::string key = args[0];
            std::string value;
            if (args[1].is_boolean()) {
                value = args[1].get<bool>() ? "true" : "false";
            } else if (args[1].is_string()) {
                value = args[1].get<std::string>();
            } else {
                return makeError("INVALID_ARGUMENT",
                    "Setting value must be a string or boolean");
            }

            // Special case: reset
            if (key == "reset") {
                config.resetToDefaults();
                if (!config.save()) {
                    return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
                }
                syncOverlay();
                return makeSuccess();
            }

            // Validate key
            auto keyResult = validateSettingKey(key);
            if (!keyResult.valid) {
                return makeError(keyResult.errorCode, keyResult.errorMessage);
            }

            // Validate value
            auto valResult = validateSettingValue(key, value);
            if (!valResult.valid) {
                return makeError(valResult.errorCode, valResult.errorMessage);
            }

            // Convert string "true"/"false" to JSON booleans for boolean settings
            json parsedValue = value;
            if (key != "language" && (value == "true" || value == "false")) {
                parsedValue = (value == "true");
            }

            config.setSetting(key, parsedValue);
            if (!config.save()) {
                return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
            }
            syncOverlay();
            return makeSuccess();
        } catch (const json::parse_error& e) {
            return makeError("INVALID_ARGUMENT", std::string("JSON parse error: ") + e.what());
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("saveSetting failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "saveSetting failed with unknown error");
        }
    });

    w.bind("saveDisplayMode", [&config, syncOverlay](const std::string& args_str) -> std::string {
        try {
            auto args = json::parse(args_str);
            if (!args.is_array() || args.size() < 1 || !args[0].is_string()) {
                return makeError("INVALID_ARGUMENT",
                    "saveDisplayMode requires a JSON string argument");
            }

            json dm = json::parse(args[0].get<std::string>());
            auto result = validateDisplayMode(dm);
            if (!result.valid) {
                return makeError(result.errorCode, result.errorMessage);
            }

            config.setDisplayMode(dm);
            if (!config.save()) {
                return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
            }
            syncOverlay();
            return makeSuccess();
        } catch (const json::parse_error& e) {
            return makeError("INVALID_ARGUMENT", std::string("JSON parse error: ") + e.what());
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("saveDisplayMode failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "saveDisplayMode failed with unknown error");
        }
    });

    w.bind("getCrosshairs", [&config](const std::string&) -> std::string {
        try {
            return config.getCrosshairs().dump();
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("getCrosshairs failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "getCrosshairs failed with unknown error");
        }
    });

    w.bind("activateCrosshair", [&config, syncOverlay](const std::string& args_str) -> std::string {
        try {
            auto args = json::parse(args_str);
            if (!args.is_array() || args.size() < 1 || !args[0].is_number_integer()) {
                return makeError("INVALID_ARGUMENT",
                    "activateCrosshair requires an integer ID argument");
            }

            int id = args[0].get<int>();
            auto result = validateCrosshairId(id, config.getCrosshairs());
            if (!result.valid) {
                return makeError(result.errorCode, result.errorMessage);
            }

            config.activateCrosshair(id);
            if (!config.save()) {
                return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
            }
            syncOverlay();
            return makeSuccess();
        } catch (const json::parse_error& e) {
            return makeError("INVALID_ARGUMENT", std::string("JSON parse error: ") + e.what());
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("activateCrosshair failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "activateCrosshair failed with unknown error");
        }
    });

    w.bind("addCrosshair", [&config](const std::string& args_str) -> std::string {
        try {
            auto args = json::parse(args_str);
            if (!args.is_array() || args.size() < 2 || !args[0].is_string() || !args[1].is_string()) {
                return makeError("INVALID_ARGUMENT",
                    "addCrosshair requires 2 string arguments: name, svg_d");
            }

            std::string name = args[0].get<std::string>();
            std::string svgD = args[1].get<std::string>();

            auto result = validateNewCrosshair(name, svgD, config.getCrosshairs());
            if (!result.valid) {
                return makeError(result.errorCode, result.errorMessage);
            }

            int newId = config.addCrosshair(name, svgD);
            if (!config.save()) {
                return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
            }
            return makeSuccess({{"id", newId}});
        } catch (const json::parse_error& e) {
            return makeError("INVALID_ARGUMENT", std::string("JSON parse error: ") + e.what());
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("addCrosshair failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "addCrosshair failed with unknown error");
        }
    });

    w.bind("deleteCrosshair", [&config](const std::string& args_str) -> std::string {
        try {
            auto args = json::parse(args_str);
            if (!args.is_array() || args.size() < 1 || !args[0].is_number_integer()) {
                return makeError("INVALID_ARGUMENT",
                    "deleteCrosshair requires an integer ID argument");
            }

            int id = args[0].get<int>();
            auto result = validateDeleteCrosshair(id, config.getCrosshairs());
            if (!result.valid) {
                return makeError(result.errorCode, result.errorMessage);
            }

            if (!config.deleteCrosshairById(id)) {
                return makeError("INVALID_CROSSHAIR_ID",
                    "Crosshair with ID " + std::to_string(id) + " not found");
            }
            if (!config.save()) {
                return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
            }
            return makeSuccess();
        } catch (const json::parse_error& e) {
            return makeError("INVALID_ARGUMENT", std::string("JSON parse error: ") + e.what());
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("deleteCrosshair failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "deleteCrosshair failed with unknown error");
        }
    });

    w.bind("savePosition", [&config, syncOverlay](const std::string& args_str) -> std::string {
        try {
            auto args = json::parse(args_str);
            if (!args.is_array() || args.size() < 1 || !args[0].is_string()) {
                return makeError("INVALID_ARGUMENT",
                    "savePosition requires a JSON string argument");
            }

            json pos = json::parse(args[0].get<std::string>());
            auto result = validatePosition(pos);
            if (!result.valid) {
                return makeError(result.errorCode, result.errorMessage);
            }

            config.setPosition(pos);
            if (!config.save()) {
                return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
            }
            syncOverlay();
            return makeSuccess();
        } catch (const json::parse_error& e) {
            return makeError("INVALID_ARGUMENT", std::string("JSON parse error: ") + e.what());
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("savePosition failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "savePosition failed with unknown error");
        }
    });

    w.bind("resetPosition", [&config, syncOverlay](const std::string&) -> std::string {
        try {
            json pos = {{"x_offset", 0}, {"y_offset", 0}, {"scale", 1.0}};
            config.setPosition(pos);
            if (!config.save()) {
                return makeError("CONFIG_SAVE_ERROR", "Failed to write config file");
            }
            syncOverlay();
            return pos.dump();
        } catch (const std::exception& e) {
            return makeError("INTERNAL_ERROR", std::string("resetPosition failed: ") + e.what());
        } catch (...) {
            return makeError("INTERNAL_ERROR", "resetPosition failed with unknown error");
        }
    });
}
