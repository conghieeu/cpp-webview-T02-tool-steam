#pragma once
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class ConfigManager {
public:
    ConfigManager();
    ~ConfigManager() = default;

    // Path resolution
    static std::string getConfigDir();
    static std::string getConfigFilePath();

    // Lifecycle
    bool load();
    bool save();
    void resetToDefaults();

    // Read accessors
    const json& getConfig() const { return m_config; }
    const json& getSettings() const { return m_config["settings"]; }
    const json& getDisplayMode() const { return m_config["display_mode"]; }
    const json& getCrosshairs() const { return m_config["crosshairs"]; }
    const json& getPosition() const { return m_config["position"]; }

    // Mutations (caller must call save() separately)
    void setSetting(const std::string& key, const json& value);
    void setDisplayMode(const json& dm);
    void setPosition(const json& pos);
    void activateCrosshair(int id);
    int  addCrosshair(const std::string& name, const std::string& svgD);
    bool deleteCrosshairById(int id);
    bool isPresetCrosshair(int id) const;

    // Metadata
    static const std::vector<std::string>& supportedLanguages();
    static const std::vector<int>& presetIds();

private:
    json m_config;
    static json defaultConfig();
    static bool ensureConfigDir();
    bool isValidConfig(const json& j) const;

    static const std::vector<int> s_presetIds;
    static const std::vector<std::string> s_supportedLangs;
};
