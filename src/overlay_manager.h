#pragma once

#include <string>
#include <windows.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class OverlayManager {
public:
    OverlayManager();
    ~OverlayManager();

    bool start();
    void stop();

    void sendUpdate(const json& state);

private:
    void writeCommand(const json& cmd);

    HANDLE m_hChildStd_IN_Rd = NULL;
    HANDLE m_hChildStd_IN_Wr = NULL;
    HANDLE m_hNul = NULL;
    PROCESS_INFORMATION m_piProcInfo = {0};
    bool m_running = false;
};
