#pragma once
#include "webview/webview.h"
#include "config_manager.h"
#include "overlay_manager.h"

void registerBindings(webview::webview& w, ConfigManager& config, OverlayManager& overlay);
