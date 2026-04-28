#include "overlay_manager.h"
#include <iostream>

OverlayManager::OverlayManager() {
    ZeroMemory(&m_piProcInfo, sizeof(PROCESS_INFORMATION));
}

OverlayManager::~OverlayManager() {
    stop();
}

// Walk up from the exe directory to find src/overlay/overlay.py
static std::string findOverlayScript() {
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);

    // Extract directory from exe path
    std::string dir(exePath);
    auto pos = dir.find_last_of("\\/");
    if (pos != std::string::npos) {
        dir = dir.substr(0, pos);
    }

    // Walk up the directory tree looking for src/overlay/overlay.py
    std::string current = dir;
    while (true) {
        std::string candidate = current + "\\src\\overlay\\overlay.py";
        if (GetFileAttributesA(candidate.c_str()) != INVALID_FILE_ATTRIBUTES) {
            return candidate;
        }
        // Check if this is the root (drive root like "C:\")
        size_t len = current.length();
        if (len < 3 || current[len - 1] == ':') break;
        // Go up one directory
        auto slash = current.find_last_of("\\/");
        if (slash == std::string::npos || slash == 0) break;
        current = current.substr(0, slash);
    }

    // Fallback: relative path (works when CWD is the project root)
    return "src\\overlay\\overlay.py";
}

bool OverlayManager::start() {
    if (m_running) return true;

    SECURITY_ATTRIBUTES saAttr;
    saAttr.nLength = sizeof(SECURITY_ATTRIBUTES);
    saAttr.bInheritHandle = TRUE;
    saAttr.lpSecurityDescriptor = NULL;

    // Create a pipe for the child process's STDIN.
    if (!CreatePipe(&m_hChildStd_IN_Rd, &m_hChildStd_IN_Wr, &saAttr, 0)) {
        return false;
    }

    // Ensure the write handle to the pipe for STDIN is not inherited.
    if (!SetHandleInformation(m_hChildStd_IN_Wr, HANDLE_FLAG_INHERIT, 0)) {
        CloseHandle(m_hChildStd_IN_Rd);
        CloseHandle(m_hChildStd_IN_Wr);
        return false;
    }

    // Open NUL device for stdout/stderr (must be valid when using STARTF_USESTDHANDLES)
    m_hNul = CreateFileA("NUL", GENERIC_WRITE, FILE_SHARE_WRITE | FILE_SHARE_READ,
                         &saAttr, OPEN_EXISTING, 0, NULL);

    // Build absolute path to the Python overlay script
    std::string scriptPath = findOverlayScript();
    std::string cmd = std::string("python \"") + scriptPath + "\"";
    char cmdLine[1024];
    strncpy_s(cmdLine, cmd.c_str(), _TRUNCATE);

    STARTUPINFOA siStartInfo;
    ZeroMemory(&siStartInfo, sizeof(STARTUPINFOA));
    siStartInfo.cb = sizeof(STARTUPINFOA);
    siStartInfo.dwFlags |= STARTF_USESTDHANDLES;
    siStartInfo.hStdInput = m_hChildStd_IN_Rd;
    siStartInfo.hStdOutput = m_hNul;
    siStartInfo.hStdError = m_hNul;

    BOOL bSuccess = CreateProcessA(
        NULL,
        cmdLine,
        NULL,
        NULL,
        TRUE,             // bInheritHandles = TRUE
        CREATE_NO_WINDOW,
        NULL,
        NULL,
        &siStartInfo,
        &m_piProcInfo);

    if (!bSuccess) {
        CloseHandle(m_hChildStd_IN_Rd);
        CloseHandle(m_hChildStd_IN_Wr);
        if (m_hNul && m_hNul != INVALID_HANDLE_VALUE) CloseHandle(m_hNul);
        m_hChildStd_IN_Rd = NULL;
        m_hChildStd_IN_Wr = NULL;
        m_hNul = NULL;
        return false;
    }

    m_running = true;
    return true;
}

void OverlayManager::stop() {
    if (!m_running) return;

    // Send quit command to child
    writeCommand({{"action", "quit"}});

    // Wait a bit, then forcefully terminate if needed
    if (WaitForSingleObject(m_piProcInfo.hProcess, 1000) == WAIT_TIMEOUT) {
        TerminateProcess(m_piProcInfo.hProcess, 0);
    }

    CloseHandle(m_piProcInfo.hProcess);
    CloseHandle(m_piProcInfo.hThread);
    CloseHandle(m_hChildStd_IN_Wr);
    CloseHandle(m_hChildStd_IN_Rd);
    if (m_hNul && m_hNul != INVALID_HANDLE_VALUE) CloseHandle(m_hNul);

    ZeroMemory(&m_piProcInfo, sizeof(PROCESS_INFORMATION));
    m_hChildStd_IN_Wr = NULL;
    m_hChildStd_IN_Rd = NULL;
    m_hNul = NULL;
    m_running = false;
}

void OverlayManager::sendUpdate(const json& state) {
    if (!m_running) return;
    json cmd = {
        {"action", "update"},
        {"state", state}
    };
    writeCommand(cmd);
}

void OverlayManager::writeCommand(const json& cmd) {
    if (!m_hChildStd_IN_Wr) return;

    std::string msg = cmd.dump() + "\n";
    DWORD dwWritten;
    WriteFile(m_hChildStd_IN_Wr, msg.c_str(), (DWORD)msg.length(), &dwWritten, NULL);

    // Flush the pipe to ensure it's sent immediately
    FlushFileBuffers(m_hChildStd_IN_Wr);
}
