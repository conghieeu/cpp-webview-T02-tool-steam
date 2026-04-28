import sys
import json
import threading
import os
from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout
from PyQt6.QtSvgWidgets import QSvgWidget
from PyQt6.QtCore import Qt, pyqtSignal, QByteArray

LOG_FILE = os.path.join(os.environ.get("TEMP", "."), "tactical_hud_overlay.log")

def log(msg):
    try:
        with open(LOG_FILE, "a") as f:
            f.write(f"{msg}\n")
    except:
        pass

class OverlayWindow(QWidget):
    update_signal = pyqtSignal(dict)

    def __init__(self):
        super().__init__()
        # Make the window transparent, frameless, always on top, and click-through
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.WindowTransparentForInput |
            Qt.WindowType.Tool # Hide from taskbar
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # We will span the entire screen
        screen = QApplication.primaryScreen().geometry()
        self.setGeometry(screen)

        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        
        self.svg_widget = QSvgWidget(self)
        self.svg_widget.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # Center the SVG widget initially
        self.default_size = 100
        self.svg_widget.setFixedSize(self.default_size, self.default_size)
        
        self.x_offset = 0
        self.y_offset = 0
        self.scale = 1.0
        self.hidden = False
        self.mode = "windowed"

        self.update_signal.connect(self.handle_update)
        
        self.center_widget()

        # Start background thread to read from stdin
        self.stdin_thread = threading.Thread(target=self.read_stdin, daemon=True)
        self.stdin_thread.start()

    def center_widget(self):
        # Position the widget in the center of the screen, plus offsets
        screen = QApplication.primaryScreen().geometry()
        center_x = screen.width() // 2
        center_y = screen.height() // 2
        
        widget_w = int(self.default_size * self.scale)
        widget_h = int(self.default_size * self.scale)
        
        self.svg_widget.setFixedSize(widget_w, widget_h)
        
        pos_x = center_x - (widget_w // 2) + self.x_offset
        pos_y = center_y - (widget_h // 2) + self.y_offset
        
        self.svg_widget.move(pos_x, pos_y)

    def read_stdin(self):
        log("read_stdin thread started")
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    log("stdin ended (EOF)")
                    break
                log(f"stdin received: {line.strip()}")
                data = json.loads(line.strip())
                if data.get("action") == "quit":
                    log("received quit command")
                    QApplication.quit()
                    break
                elif data.get("action") == "update":
                    state = data.get("state", {})
                    log(f"received update: hidden={state.get('hidden')}, mode={state.get('mode')}, crosshair={'yes' if state.get('crosshair') else 'no'}")
                    self.update_signal.emit(state)
            except Exception as e:
                log(f"stdin error: {e}")
                continue

    def handle_update(self, state):
        # state can have: 'crosshair' (svg_d), 'position', 'mode', 'hidden'
        log(f"handle_update: {json.dumps(state)}")

        if "hidden" in state:
            self.hidden = state["hidden"]

        if "mode" in state:
            self.mode = state["mode"].lower()

        # Determine visibility
        if self.hidden or self.mode not in ["overlay", "fullscreen"]:
            log(f"hiding overlay (hidden={self.hidden}, mode={self.mode})")
            self.hide()
        else:
            log("showing overlay")
            self.show()

        if "position" in state:
            pos = state["position"]
            self.x_offset = pos.get("x_offset", self.x_offset)
            self.y_offset = pos.get("y_offset", self.y_offset)
            self.scale = pos.get("scale", self.scale)
            
        if "crosshair" in state:
            svg_d = state["crosshair"]
            if svg_d:
                # Wrap the path in a full SVG document
                svg_content = f"""
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
                    <path fill="#FF5500" d="{svg_d}"/>
                </svg>
                """
                self.svg_widget.load(QByteArray(svg_content.encode('utf-8')))
            else:
                self.svg_widget.load(QByteArray(b""))

        self.center_widget()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = OverlayWindow()
    window.show()
    sys.exit(app.exec())
