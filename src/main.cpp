#include <iostream>
#include "webview/webview.h"
#include "config_manager.h"
#include "bindings.h"
#include "index_html.h"
#include "overlay_manager.h"

#ifdef _WIN32
#include <windows.h>

// ─── Custom Window Chrome (hide native title bar, keep caption buttons via JS) ───

static WNDPROC g_originalWndProc = nullptr;
static constexpr int RESIZE_BORDER = 5;

static void ApplyDwmStyles(HWND hwnd) {
    static HMODULE s_dwmapi = LoadLibraryW(L"dwmapi.dll");
    if (!s_dwmapi) return;
    using DwmFn = HRESULT(WINAPI *)(HWND, DWORD, LPCVOID, DWORD);
    static auto s_dwmFn = (DwmFn)GetProcAddress(s_dwmapi, "DwmSetWindowAttribute");
    if (!s_dwmFn) return;

    // Force dark mode title bar (default Windows blue → dark)
    BOOL darkMode = TRUE;
    s_dwmFn(hwnd, 20 /*DWMWA_USE_IMMERSIVE_DARK_MODE*/, &darkMode, sizeof(darkMode));

    // Remove accent border (Windows 11+ only, silently fails on Win10)
    DWORD transparentBorder = 0x00FFFFFF;
    s_dwmFn(hwnd, 34 /*DWMWA_BORDER_COLOR*/, &transparentBorder, sizeof(transparentBorder));
}

static LRESULT CALLBACK CustomWndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
    case WM_NCCALCSIZE: {
        // Hide non-client area (title bar + border)
        if (wp && IsZoomed(hwnd)) {
            auto *ncp = reinterpret_cast<NCCALCSIZE_PARAMS *>(lp);
            RECT workArea;
            if (SystemParametersInfo(SPI_GETWORKAREA, 0, &workArea, 0)) {
                ncp->rgrc[0] = workArea;
            }
        }
        return 0;
    }
    case WM_NCHITTEST: {
        // Allow resizing from edges
        POINT pt = {(short)LOWORD(lp), (short)HIWORD(lp)};
        ScreenToClient(hwnd, &pt);
        RECT rc;
        GetClientRect(hwnd, &rc);

        if (pt.y < RESIZE_BORDER) {
            if (pt.x < RESIZE_BORDER) return HTTOPLEFT;
            if (pt.x >= rc.right - RESIZE_BORDER) return HTTOPRIGHT;
            return HTTOP;
        }
        if (pt.y >= rc.bottom - RESIZE_BORDER) {
            if (pt.x < RESIZE_BORDER) return HTBOTTOMLEFT;
            if (pt.x >= rc.right - RESIZE_BORDER) return HTBOTTOMRIGHT;
            return HTBOTTOM;
        }
        if (pt.x < RESIZE_BORDER) return HTLEFT;
        if (pt.x >= rc.right - RESIZE_BORDER) return HTRIGHT;

        return HTCLIENT;
    }
    case WM_SETTINGCHANGE: {
        auto result = CallWindowProc(g_originalWndProc, hwnd, msg, wp, lp);
        ApplyDwmStyles(hwnd); // Re-apply dark mode when system theme changes
        return result;
    }
    }
    return CallWindowProc(g_originalWndProc, hwnd, msg, wp, lp);
}

// ─── Win32 helper for window control bindings ───

static void MinimizeAppWindow(HWND hwnd) { ShowWindow(hwnd, SW_MINIMIZE); }
static void MaximizeAppWindow(HWND hwnd) {
    WINDOWPLACEMENT wp;
    wp.length = sizeof(wp);
    GetWindowPlacement(hwnd, &wp);
    ShowWindow(hwnd, wp.showCmd == SW_SHOWMAXIMIZED ? SW_RESTORE : SW_SHOWMAXIMIZED);
}
static void CloseAppWindow(HWND hwnd) { PostMessage(hwnd, WM_CLOSE, 0, 0); }
static void StartWindowDrag(HWND hwnd) {
    ReleaseCapture();
    POINT pt;
    GetCursorPos(&pt);
    SendMessage(hwnd, WM_NCLBUTTONDOWN, HTCAPTION, MAKELPARAM(pt.x, pt.y));
}

static void MoveWindow(HWND hwnd, int dx, int dy) {
    RECT rc;
    GetWindowRect(hwnd, &rc);
    SetWindowPos(hwnd, nullptr, rc.left + dx, rc.top + dy, 0, 0,
                 SWP_NOSIZE | SWP_NOZORDER);
}

#endif // _WIN32

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

        OverlayManager overlay;
        if (!overlay.start()) {
            std::cerr << "Failed to start overlay process\n";
        }

        webview::webview main_window(false, nullptr);
        main_window.set_title("Tactical HUD");
        main_window.set_size(1200, 720, WEBVIEW_HINT_NONE);

#ifdef _WIN32
        // Customize window: remove native title bar, force dark theme
        auto hwndResult = main_window.window();
        if (hwndResult.ok()) {
            HWND hwnd = static_cast<HWND>(hwndResult.value());

            // Remove caption styles so no native title bar is drawn
            LONG style = GetWindowLong(hwnd, GWL_STYLE);
            style &= ~(WS_CAPTION | WS_SYSMENU);
            style |= WS_POPUP | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX;
            SetWindowLong(hwnd, GWL_STYLE, style);

            // Install custom WndProc FIRST, then trigger recalc with SWP_FRAMECHANGED
            g_originalWndProc = (WNDPROC)GetWindowLongPtr(hwnd, GWLP_WNDPROC);
            SetWindowLongPtr(hwnd, GWLP_WNDPROC, (LONG_PTR)CustomWndProc);
            SetWindowPos(hwnd, NULL, 0, 0, 0, 0,
                         SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);

            // Apply DWM dark styles and remove border
            ApplyDwmStyles(hwnd);

            // Register window control JS bindings
            main_window.bind("minimizeWindow", [hwnd](const std::string &) -> std::string {
                MinimizeAppWindow(hwnd);
                return "{}";
            });
            main_window.bind("maximizeWindow", [hwnd](const std::string &) -> std::string {
                MaximizeAppWindow(hwnd);
                return "{}";
            });
            main_window.bind("closeWindow", [hwnd](const std::string &) -> std::string {
                CloseAppWindow(hwnd);
                return "{}";
            });
            main_window.bind("isMaximized", [hwnd](const std::string &) -> std::string {
                return IsZoomed(hwnd) ? "true" : "false";
            });
            main_window.bind("moveWindowBy", [hwnd](const std::string &args) -> std::string {
                try {
                    auto j = json::parse(args);
                    if (j.is_array() && j.size() >= 2) {
                        MoveWindow(hwnd, j[0].get<int>(), j[1].get<int>());
                    }
                } catch (...) {}
                return "{}";
            });
            // Also try native drag (works well on most systems)
            main_window.bind("startWindowDrag", [hwnd](const std::string &) -> std::string {
                StartWindowDrag(hwnd);
                return "{}";
            });
        }
#endif

        registerBindings(main_window, config, overlay);
        
        // Initial sync to overlay
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
        syncOverlay();

        main_window.set_html(INDEX_HTML);
        main_window.run();
    } catch (const webview::exception& e) {
        std::cerr << e.what() << '\n';
        return 1;
    }

    return 0;
}
