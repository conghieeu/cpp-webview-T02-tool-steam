#pragma once
#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

inline std::string makeError(const std::string& code, const std::string& message) {
    return json{
        {"ok", false},
        {"error", {{"code", code}, {"message", message}}}
    }.dump();
}

inline std::string makeSuccess(const json& data = json::object()) {
    json result = {{"ok", true}};
    result.update(data);
    return result.dump();
}

namespace ErrorCode {
    constexpr const char* INVALID_KEY = "INVALID_KEY";
    constexpr const char* INVALID_VALUE = "INVALID_VALUE";
    constexpr const char* INVALID_ARGUMENT = "INVALID_ARGUMENT";
    constexpr const char* INVALID_CROSSHAIR_ID = "INVALID_CROSSHAIR_ID";
    constexpr const char* PRESET_PROTECTED = "PRESET_PROTECTED";
    constexpr const char* CROSSHAIR_LIMIT = "CROSSHAIR_LIMIT";
    constexpr const char* NAME_TOO_LONG = "NAME_TOO_LONG";
    constexpr const char* SVG_TOO_LONG = "SVG_TOO_LONG";
    constexpr const char* CONFIG_LOAD_ERROR = "CONFIG_LOAD_ERROR";
    constexpr const char* CONFIG_SAVE_ERROR = "CONFIG_SAVE_ERROR";
    constexpr const char* INTERNAL_ERROR = "INTERNAL_ERROR";
}
