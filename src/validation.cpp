#include "validation.h"
#include "config_manager.h"
#include <algorithm>
#include <regex>

const std::vector<std::string> knownSettingKeys = {
    "hidden", "start_with_windows", "hardware_acceleration", "language", "reset"
};

const std::vector<std::string> modeValues = {
    "fullscreen", "windowed", "overlay"
};

ValidationResult validateSettingKey(const std::string& key) {
    if (std::find(knownSettingKeys.begin(), knownSettingKeys.end(), key) != knownSettingKeys.end()) {
        return ValidationResult::ok();
    }
    return ValidationResult::fail("INVALID_KEY",
        "Unknown setting key: '" + key + "'. Valid keys: hidden, start_with_windows, hardware_acceleration, language");
}

ValidationResult validateSettingValue(const std::string& key, const std::string& value) {
    if (key == "reset") return ValidationResult::ok();

    if (key == "language") {
        const auto& langs = ConfigManager::supportedLanguages();
        if (std::find(langs.begin(), langs.end(), value) != langs.end()) {
            return ValidationResult::ok();
        }
        std::string valid;
        for (size_t i = 0; i < langs.size(); i++) {
            if (i > 0) valid += ", ";
            valid += langs[i];
        }
        return ValidationResult::fail("INVALID_VALUE",
            "Unsupported language: '" + value + "'. Supported: " + valid);
    }

    // Boolean settings
    if (key == "hidden" || key == "start_with_windows" || key == "hardware_acceleration") {
        // Accept both JSON booleans (string "true"/"false") and actual booleans
        if (value == "true" || value == "false") {
            return ValidationResult::ok();
        }
        return ValidationResult::fail("INVALID_VALUE",
            "Setting '" + key + "' must be true or false");
    }

    return ValidationResult::ok();
}

ValidationResult validateDisplayMode(const json& dm) {
    if (!dm.is_object()) {
        return ValidationResult::fail("INVALID_ARGUMENT", "Display mode must be a JSON object");
    }

    if (!dm.contains("mode") || !dm["mode"].is_string()) {
        return ValidationResult::fail("INVALID_ARGUMENT", "Display mode must contain a 'mode' string");
    }
    std::string mode = dm["mode"];
    if (std::find(modeValues.begin(), modeValues.end(), mode) == modeValues.end()) {
        return ValidationResult::fail("INVALID_VALUE",
            "Invalid mode: '" + mode + "'. Must be one of: fullscreen, windowed, overlay");
    }

    if (!dm.contains("resolution") || !dm["resolution"].is_string()) {
        return ValidationResult::fail("INVALID_ARGUMENT", "Display mode must contain a 'resolution' string");
    }
    std::string res = dm["resolution"];
    if (!std::regex_match(res, std::regex("^\\d+[xX]\\d+$"))) {
        return ValidationResult::fail("INVALID_VALUE",
            "Invalid resolution format: '" + res + "'. Expected format like '1920x1080'");
    }

    if (!dm.contains("framerate_cap") || !dm["framerate_cap"].is_number_integer()) {
        return ValidationResult::fail("INVALID_ARGUMENT", "Display mode must contain a 'framerate_cap' integer");
    }
    int fps = dm["framerate_cap"];
    if (fps < 30 || fps > 240) {
        return ValidationResult::fail("INVALID_VALUE",
            "Framerate cap must be between 30 and 240, got " + std::to_string(fps));
    }

    return ValidationResult::ok();
}

ValidationResult validateCrosshairId(int id, const json& crosshairs) {
    if (id < 1) {
        return ValidationResult::fail("INVALID_CROSSHAIR_ID", "Crosshair ID must be >= 1");
    }
    auto it = std::find_if(crosshairs.begin(), crosshairs.end(),
        [id](const json& c) { return c["id"] == id; });
    if (it == crosshairs.end()) {
        return ValidationResult::fail("INVALID_CROSSHAIR_ID",
            "Crosshair with ID " + std::to_string(id) + " not found");
    }
    return ValidationResult::ok();
}

ValidationResult validateNewCrosshair(const std::string& name,
                                       const std::string& svgD,
                                       const json& crosshairs) {
    if (name.empty()) {
        return ValidationResult::fail("INVALID_ARGUMENT", "Crosshair name cannot be empty");
    }
    if (name.length() > 50) {
        return ValidationResult::fail("NAME_TOO_LONG", "Crosshair name too long (max 50 characters)");
    }
    if (svgD.empty()) {
        return ValidationResult::fail("INVALID_ARGUMENT", "SVG path data cannot be empty");
    }
    if (svgD.length() > 2000) {
        return ValidationResult::fail("SVG_TOO_LONG", "SVG path data too long (max 2000 characters)");
    }
    if (crosshairs.size() >= 50) {
        return ValidationResult::fail("CROSSHAIR_LIMIT", "Maximum 50 crosshairs allowed");
    }
    return ValidationResult::ok();
}

ValidationResult validateDeleteCrosshair(int id, const json& crosshairs) {
    auto result = validateCrosshairId(id, crosshairs);
    if (!result.valid) return result;

    // Check if it's a preset by finding the item and checking its type
    auto it = std::find_if(crosshairs.begin(), crosshairs.end(),
        [id](const json& c) { return c["id"] == id; });
    if (it != crosshairs.end() && (*it)["type"] == "preset") {
        return ValidationResult::fail("PRESET_PROTECTED",
            "Preset crosshairs cannot be deleted");
    }

    return ValidationResult::ok();
}

ValidationResult validatePosition(const json& pos) {
    if (!pos.is_object()) {
        return ValidationResult::fail("INVALID_ARGUMENT", "Position must be a JSON object");
    }

    auto checkField = [&](const std::string& field, double min, double max) -> ValidationResult {
        if (!pos.contains(field)) {
            return ValidationResult::fail("INVALID_ARGUMENT",
                "Position missing required field: '" + field + "'");
        }
        double val = pos[field].is_number() ? pos[field].get<double>() : -999999;
        if (val < min || val > max) {
            return ValidationResult::fail("INVALID_VALUE",
                "Position '" + field + "' must be between " + std::to_string(min) +
                " and " + std::to_string(max) + ", got " + std::to_string(val));
        }
        return ValidationResult::ok();
    };

    auto r = checkField("x_offset", -5000, 5000);
    if (!r.valid) return r;
    r = checkField("y_offset", -5000, 5000);
    if (!r.valid) return r;
    r = checkField("scale", 0.1, 5.0);
    if (!r.valid) return r;

    return ValidationResult::ok();
}
