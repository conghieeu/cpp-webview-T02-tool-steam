#pragma once
#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

struct ValidationResult {
    bool valid;
    std::string errorCode;
    std::string errorMessage;

    static ValidationResult ok() { return {true, "", ""}; }
    static ValidationResult fail(const std::string& code, const std::string& msg) {
        return {false, code, msg};
    }
};

// saveSetting: key must be one of the known keys
ValidationResult validateSettingKey(const std::string& key);

// saveSetting(value): type check based on key
ValidationResult validateSettingValue(const std::string& key, const std::string& value);

// saveDisplayMode: mode enum, resolution format, framerate range
ValidationResult validateDisplayMode(const json& dm);

// activateCrosshair: id must exist in the crosshairs array
ValidationResult validateCrosshairId(int id, const json& crosshairs);

// addCrosshair: name 1-50, svgD 1-2000, array < 50
ValidationResult validateNewCrosshair(const std::string& name,
                                      const std::string& svgD,
                                      const json& crosshairs);

// deleteCrosshair: id exists and is not a preset
ValidationResult validateDeleteCrosshair(int id, const json& crosshairs);

// savePosition: x/y in range, scale in range
ValidationResult validatePosition(const json& pos);
