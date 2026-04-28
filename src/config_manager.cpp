#include "config_manager.h"
#include <fstream>
#include <algorithm>
#include <windows.h>
#include <shlobj.h>

const std::vector<int> ConfigManager::s_presetIds = {1, 2, 3, 4, 5, 6};
const std::vector<std::string> ConfigManager::s_supportedLangs = {"en", "vi", "es", "fr", "de", "ja"};

static void updateWindowsStartup(bool enable) {
    HKEY hKey;
    const char* runKeyPath = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run";
    const char* appName = "TacticalHUD";

    if (RegOpenKeyExA(HKEY_CURRENT_USER, runKeyPath, 0, KEY_SET_VALUE, &hKey) == ERROR_SUCCESS) {
        if (enable) {
            char exePath[MAX_PATH];
            GetModuleFileNameA(NULL, exePath, MAX_PATH);
            std::string quotedPath = std::string("\"") + exePath + "\"";
            RegSetValueExA(hKey, appName, 0, REG_SZ, (const BYTE*)quotedPath.c_str(), quotedPath.length() + 1);
        } else {
            RegDeleteValueA(hKey, appName);
        }
        RegCloseKey(hKey);
    }
}

ConfigManager::ConfigManager() {
    m_config = defaultConfig();
}

std::string ConfigManager::getConfigDir() {
    wchar_t appData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_APPDATA, NULL, 0, appData))) {
        std::wstring dir = std::wstring(appData) + L"\\TacticalHUD";
        int len = WideCharToMultiByte(CP_UTF8, 0, dir.c_str(), -1, NULL, 0, NULL, NULL);
        std::string utf8(len, '\0');
        WideCharToMultiByte(CP_UTF8, 0, dir.c_str(), -1, &utf8[0], len, NULL, NULL);
        utf8.resize(len - 1);
        return utf8;
    }
    // Fallback: exe directory
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    std::string exe(exePath);
    auto pos = exe.find_last_of("\\/");
    return exe.substr(0, pos);
}

std::string ConfigManager::getConfigFilePath() {
    return getConfigDir() + "\\config.json";
}

bool ConfigManager::ensureConfigDir() {
    std::string dir = getConfigDir();
    int len = MultiByteToWideChar(CP_UTF8, 0, dir.c_str(), -1, NULL, 0);
    std::wstring wdir(len, '\0');
    MultiByteToWideChar(CP_UTF8, 0, dir.c_str(), -1, &wdir[0], len);

    int result = SHCreateDirectoryExW(NULL, wdir.c_str(), NULL);
    return result == ERROR_SUCCESS || result == ERROR_ALREADY_EXISTS
        || result == ERROR_FILE_EXISTS;  // ERROR_FILE_EXISTS when trailing backslash omitted
}

json ConfigManager::defaultConfig() {
    return json{
        {"settings", {
            {"hidden", false},
            {"start_with_windows", false},
            {"hardware_acceleration", false},
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

bool ConfigManager::isValidConfig(const json& j) const {
    return j.contains("settings") && j.contains("display_mode") &&
           j.contains("crosshairs") && j.contains("position") &&
           j["settings"].is_object() && j["display_mode"].is_object() &&
           j["crosshairs"].is_array() && j["position"].is_object();
}

bool ConfigManager::load() {
    ensureConfigDir();

    std::ifstream f(getConfigFilePath());
    if (!f.is_open()) {
        m_config = defaultConfig();
        return save();
    }

    try {
        json j = json::parse(f);
        if (!isValidConfig(j)) {
            m_config = defaultConfig();
            return save();
        }
        m_config = std::move(j);

        // Migrate old string-booleans to real booleans
        auto& s = m_config["settings"];
        for (auto& el : {"hidden", "start_with_windows", "hardware_acceleration"}) {
            if (s[el].is_string()) {
                s[el] = (s[el].get<std::string>() == "true");
            }
        }

        // Ensure language is a string
        if (s["language"].is_null()) {
            s["language"] = "en";
        }

        return true;
    } catch (...) {
        m_config = defaultConfig();
        return save();
    }
}

bool ConfigManager::save() {
    ensureConfigDir();
    std::ofstream f(getConfigFilePath());
    if (!f.is_open()) return false;
    f << m_config.dump(2);
    return true;
}

void ConfigManager::resetToDefaults() {
    m_config = defaultConfig();
    updateWindowsStartup(false);
}

void ConfigManager::setSetting(const std::string& key, const json& value) {
    m_config["settings"][key] = value;
    if (key == "start_with_windows" && value.is_boolean()) {
        updateWindowsStartup(value.get<bool>());
    }
}

void ConfigManager::setDisplayMode(const json& dm) {
    m_config["display_mode"] = dm;
}

void ConfigManager::setPosition(const json& pos) {
    m_config["position"] = pos;
}

void ConfigManager::activateCrosshair(int id) {
    for (auto& c : m_config["crosshairs"]) {
        c["is_active"] = (c["id"] == id) ? 1 : 0;
    }
}

int ConfigManager::addCrosshair(const std::string& name, const std::string& svgD) {
    int maxId = 0;
    for (const auto& c : m_config["crosshairs"]) {
        maxId = std::max(maxId, c["id"].get<int>());
    }
    int newId = maxId + 1;
    json ch = {{"id", newId}, {"name", name}, {"type", "custom"}, {"svg_d", svgD}, {"is_active", 0}};
    m_config["crosshairs"].push_back(std::move(ch));
    return newId;
}

bool ConfigManager::deleteCrosshairById(int id) {
    auto& crosshairs = m_config["crosshairs"];
    for (auto it = crosshairs.begin(); it != crosshairs.end(); ++it) {
        if ((*it)["id"] == id) {
            crosshairs.erase(it);
            return true;
        }
    }
    return false;
}

bool ConfigManager::isPresetCrosshair(int id) const {
    return std::find(s_presetIds.begin(), s_presetIds.end(), id) != s_presetIds.end();
}

const std::vector<std::string>& ConfigManager::supportedLanguages() {
    return s_supportedLangs;
}

const std::vector<int>& ConfigManager::presetIds() {
    return s_presetIds;
}
