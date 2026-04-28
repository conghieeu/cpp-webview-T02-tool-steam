// ─── C++ Native Bridge ───

const Native = {
  async call(method, ...args) {
    try {
      const raw = await window[method](...args);
      let result = raw;
      if (typeof raw === 'string') {
        try { result = JSON.parse(raw); } catch (e) {}
      }
      if (result && result.ok === false) {
        console.error(`[Native] ${method} failed:`, result.error?.code, result.error?.message);
        return null;
      }
      return result;
    } catch (err) {
      console.error(`[Native] ${method} error:`, err);
      return null;
    }
  },
  async getData() {
    const data = await this.call("getData");
    if (data) {
      storeSave(data);
      return data;
    }
    return storeLoad();
  },
  async saveSetting(key, value) {
    const result = await this.call("saveSetting", key, value);
    if (appData && key !== "reset") {
      let storeVal = value;
      if (typeof storeVal === "string") {
        if (storeVal === "true") storeVal = true;
        else if (storeVal === "false") storeVal = false;
      }
      if (!appData.settings) appData.settings = {};
      appData.settings[key] = storeVal;
      syncState();
    }
    return result;
  },
  async saveDisplayMode(obj) {
    const result = await this.call("saveDisplayMode", JSON.stringify(obj));
    if (appData) {
      appData.display_mode = obj;
      syncState();
    }
    return result;
  },
  async getCrosshairs() {
    const data = await this.call("getCrosshairs");
    if (data) {
      if (appData) appData.crosshairs = data;
      return data;
    }
    return appData?.crosshairs || null;
  },
  async activateCrosshair(id) {
    const result = await this.call("activateCrosshair", id);
    if (result && appData?.crosshairs) {
      for (const c of appData.crosshairs) c.is_active = c.id === id ? 1 : 0;
      syncState();
    }
    return result;
  },
  async addCrosshair(name, svgD) {
    const result = await this.call("addCrosshair", name, svgD);
    if (result) {
      const items = await this.call("getCrosshairs");
      if (items && appData) {
        appData.crosshairs = items;
        syncState();
      }
      return result;
    }
    if (appData?.crosshairs) {
      const maxId = appData.crosshairs.reduce((m, c) => Math.max(m, c.id), 0);
      const newCh = { id: maxId + 1, name, type: "custom", svg_d: svgD, is_active: 0 };
      appData.crosshairs.push(newCh);
      syncState();
      return { ok: true, data: { id: newCh.id } };
    }
    return result;
  },
  deleteCrosshair(id) { return this.call("deleteCrosshair", id); },
  async savePosition(obj) {
    const result = await this.call("savePosition", JSON.stringify(obj));
    if (appData) {
      appData.position = obj;
      syncState();
    }
    return result;
  },
  async resetPosition() {
    const result = await this.call("resetPosition");
    if (result && appData) {
      appData.position = { x_offset: result.x_offset, y_offset: result.y_offset, scale: result.scale };
      syncState();
    }
    return result;
  },

  // Window controls
  minimizeWindow() { return this.call("minimizeWindow"); },
  maximizeWindow() { return this.call("maximizeWindow"); },
  closeWindow() { return this.call("closeWindow"); },
  isMaximized() { return this.call("isMaximized"); },
  moveWindowBy(dx, dy) { return this.call("moveWindowBy", dx, dy); },
};

// ─── Default Config & LocalStorage Persistence ───

const DEFAULT_CONFIG = {
  settings: { hidden: false, start_with_windows: false, hardware_acceleration: false, language: "en" },
  display_mode: { mode: "windowed", resolution: "1920x1080", framerate_cap: 144 },
  crosshairs: [
    { id: 1, name: "Cross", type: "preset", svg_d: "M11 2v9H2v2h9v9h2v-9h9v-2h-9V2h-2z", is_active: 1 },
    { id: 2, name: "Circle", type: "preset", svg_d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h4v2h-4v4h-2v-4H7v-2h4V7z", is_active: 0 },
    { id: 3, name: "Dot", type: "preset", svg_d: "M12 8a4 4 0 100 8 4 4 0 000-8z", is_active: 0 },
    { id: 4, name: "Diamond", type: "preset", svg_d: "M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5zM12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z", is_active: 0 },
    { id: 5, name: "Apex", type: "preset", svg_d: "M5 5l4 4m6-4l-4 4m4 10l-4-4m-6 4l4-4M12 11a1 1 0 100 2 1 1 0 000-2z", is_active: 0 },
    { id: 6, name: "Tactical", type: "preset", svg_d: "M11 3v2h2V3h-2zM3 11v2h2v-2H3zm16 0v2h2v-2h-2zM11 19v2h2v-2h-2zM8 8l8 8M8 16l8-8M12 12", is_active: 0 },
  ],
  position: { x_offset: 0, y_offset: 0, scale: 1.0 },
};

const LS_KEY = "tactical_hud_config";

function storeSave(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

function storeLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function syncState() {
  if (appData) storeSave(appData);
}

// ─── Internationalization ───

const translations = {
  vi: {
    "Tactical HUD": "Tactical HUD",
    "Display Modes": "Chế độ Hiển thị",
    "Crosshairs": "Điểm ngắm",
    "Position & Size": "Vị trí & Kích thước",
    "Options": "Tùy chọn",
    "Help": "Trợ giúp",
    "Help & Documentation": "Trợ giúp & Tài liệu",
    "Essentials": "Cơ bản",
    "Customization": "Tùy chỉnh",
    "Support": "Hỗ trợ",
    "Hidden": "Ẩn",
    "System Override Active": "Đã kích hoạt Ghi đè Hệ thống",
    "Hardware acceleration conflicts detected. Performance may be degraded until resolved in Options.": "Phát hiện xung đột tăng tốc phần cứng. Hiệu năng có thể bị giảm cho đến khi được khắc phục trong Tùy chọn.",
    "Rendering Mode": "Chế độ Kết xuất",
    "Select how the tactical overlay integrates with your game client.": "Chọn cách lớp phủ tích hợp với ứng dụng của bạn.",
    "Fullscreen": "Toàn màn hình",
    "Windowed": "Cửa sổ",
    "Overlay": "Lớp phủ",
    "Target Resolution": "Độ phân giải Mục tiêu",
    "Match this to your in-game resolution.": "Khớp với độ phân giải mục tiêu.",
    "Performance": "Hiệu năng",
    "Limit overlay framerate to conserve GPU resources.": "Giới hạn fps lớp phủ để tiết kiệm tài nguyên GPU.",
    "Framerate Cap": "Giới hạn FPS",
    "FPS": "FPS",
    "Apply": "Áp dụng",
    "Select, customize, and preview your reticle": "Chọn, tùy chỉnh và xem trước điểm ngắm",
    "Upload": "Tải lên",
    "Overlay Calibration": "Hiệu chỉnh Lớp phủ",
    "Fine-tune the positioning and scaling relative to your primary display.": "Tinh chỉnh vị trí và tỷ lệ so với màn hình chính.",
    "X-Axis Offset": "Lệch trục X",
    "Horizontal alignment from center": "Căn chỉnh ngang từ trung tâm",
    "Y-Axis Offset": "Lệch trục Y",
    "Vertical alignment from center": "Căn chỉnh dọc từ trung tâm",
    "Global Scale": "Tỷ lệ Toàn cục",
    "Overall size of the overlay elements": "Kích thước tổng thể của các thành phần lớp phủ",
    "Quick Align Presets": "Căn chỉnh Nhanh",
    "Center All": "Căn giữa",
    "Top Edge": "Cạnh trên",
    "Bottom Edge": "Cạnh dưới",
    "Reset to Default": "Khôi phục Mặc định",
    "System Behaviors": "Hành vi Hệ thống",
    "Start with Windows": "Khởi động cùng Windows",
    "Automatically launch when system boots.": "Tự động khởi chạy khi hệ thống khởi động.",
    "Hardware Acceleration": "Tăng tốc Phần cứng",
    "Use GPU to render interface.": "Sử dụng GPU để kết xuất giao diện.",
    "Localization": "Ngôn ngữ",
    "Display Language": "Ngôn ngữ Hiển thị",
    "Danger Zone": "Khu vực Nguy hiểm",
    "Reset All Settings": "Đặt lại Cài đặt",
    "Permanently reset all configurations to factory defaults.": "Đặt lại vĩnh viễn tất cả cấu hình về mặc định.",
    "Reset Defaults": "Khôi phục Mặc định",
    "SEARCH DOCUMENTATION...": "TÌM KIẾM TÀI LIỆU...",
    "FREQUENTLY ASKED QUESTIONS": "CÂU HỎI THƯỜNG GẶP",
    "How do I change my crosshair?": "Làm thế nào để thay đổi điểm ngắm?",
    "Navigate to the Crosshairs section in the Essentials menu. Browse the gallery and click any card to instantly apply it.": "Điều hướng đến mục Điểm ngắm trong menu Cơ bản. Duyệt qua thư viện và nhấp vào thẻ để áp dụng.",
    "Why isn't my display mode applying?": "Tại sao chế độ hiển thị không được áp dụng?",
    "Ensure you have clicked the \"APPLY\" button in the bottom right corner of the Display Modes screen.": "Đảm bảo bạn đã nhấp vào nút \"ÁP DỤNG\" ở góc dưới bên phải của màn hình Chế độ Hiển thị.",
    "How to reset all settings?": "Làm thế nào để đặt lại tất cả cài đặt?",
    "Go to Customization > Options. Scroll to the bottom and click the red RESET ALL SETTINGS button. This cannot be undone.": "Đi tới Tùy chỉnh > Tùy chọn. Cuộn xuống và nhấp vào nút ĐẶT LẠI CÀI ĐẶT màu đỏ. Không thể hoàn tác.",
    "Is this app safe to use?": "Ứng dụng này có an toàn không?",
    "Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files.": "Tactical hoạt động như lớp phủ trực quan, không can thiệp bộ nhớ hay sửa đổi tệp trò chơi.",
    "How to change crosshair position?": "Làm thế nào để thay đổi vị trí điểm ngắm?",
    "Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset.": "Điều hướng đến Vị trí & Kích thước. Dùng thanh trượt X/Y để tinh chỉnh độ lệch.",
    "STILL NEED HELP?": "VẪN CẦN TRỢ GIÚP?",
    "Join our community server for support and configuration tips.": "Tham gia máy chủ cộng đồng để được hỗ trợ và mẹo cấu hình.",
    "JOIN DISCORD SERVER": "THAM GIA DISCORD",
    "Crosshair name:": "Tên điểm ngắm:",
    "Custom": "Tùy chỉnh",
    "SVG path data (d attribute):": "Dữ liệu đường dẫn SVG (thuộc tính d):",
    "Reset all settings to defaults?": "Đặt lại tất cả cài đặt về mặc định?",
  },
  es: {
    "Tactical HUD": "Tactical HUD",
    "Display Modes": "Modos de Pantalla",
    "Crosshairs": "Punterías",
    "Position & Size": "Posición y Tamaño",
    "Options": "Opciones",
    "Help": "Ayuda",
    "Help & Documentation": "Ayuda y Documentación",
    "Essentials": "Esenciales",
    "Customization": "Personalización",
    "Support": "Soporte",
    "Hidden": "Oculto",
    "System Override Active": "Anulación del Sistema Activada",
    "Hardware acceleration conflicts detected. Performance may be degraded until resolved in Options.": "Se detectaron conflictos de aceleración por hardware. El rendimiento puede verse afectado hasta que se resuelva en Opciones.",
    "Rendering Mode": "Modo de Renderizado",
    "Select how the tactical overlay integrates with your game client.": "Seleccione cómo se integra la superposición táctica con su cliente de juego.",
    "Fullscreen": "Pantalla Completa",
    "Windowed": "Ventana",
    "Overlay": "Superposición",
    "Target Resolution": "Resolución Objetivo",
    "Match this to your in-game resolution.": "Ajuste esto a la resolución de su juego.",
    "Performance": "Rendimiento",
    "Limit overlay framerate to conserve GPU resources.": "Limite los fps de la superposición para conservar recursos de la GPU.",
    "Framerate Cap": "Límite de FPS",
    "FPS": "FPS",
    "Apply": "Aplicar",
    "Select, customize, and preview your reticle": "Seleccione, personalice y previsualice su retícula",
    "Upload": "Subir",
    "Overlay Calibration": "Calibración de Superposición",
    "Fine-tune the positioning and scaling relative to your primary display.": "Ajuste la posición y escala en relación con su pantalla principal.",
    "X-Axis Offset": "Desplazamiento Eje X",
    "Horizontal alignment from center": "Alineación horizontal desde el centro",
    "Y-Axis Offset": "Desplazamiento Eje Y",
    "Vertical alignment from center": "Alineación vertical desde el centro",
    "Global Scale": "Escala Global",
    "Overall size of the overlay elements": "Tamaño general de los elementos de la superposición",
    "Quick Align Presets": "Ajustes Rápidos de Alineación",
    "Center All": "Centrar Todo",
    "Top Edge": "Borde Superior",
    "Bottom Edge": "Borde Inferior",
    "Reset to Default": "Restablecer Valores",
    "System Behaviors": "Comportamiento del Sistema",
    "Start with Windows": "Iniciar con Windows",
    "Automatically launch when system boots.": "Iniciar automáticamente al encender el sistema.",
    "Hardware Acceleration": "Aceleración por Hardware",
    "Use GPU to render interface.": "Usar la GPU para renderizar la interfaz.",
    "Localization": "Idioma",
    "Display Language": "Idioma de Pantalla",
    "Danger Zone": "Zona de Peligro",
    "Reset All Settings": "Restablecer Ajustes",
    "Permanently reset all configurations to factory defaults.": "Restablece permanentemente todas las configuraciones a los valores de fábrica.",
    "Reset Defaults": "Restablecer Valores",
    "SEARCH DOCUMENTATION...": "BUSCAR DOCUMENTACIÓN...",
    "FREQUENTLY ASKED QUESTIONS": "PREGUNTAS FRECUENTES",
    "How do I change my crosshair?": "¿Cómo cambio mi retícula?",
    "Navigate to the Crosshairs section in the Essentials menu. Browse the gallery and click any card to instantly apply it.": "Vaya a Punterías en el menú Esenciales. Explore la galería y haga clic en cualquier tarjeta para aplicarla.",
    "Why isn't my display mode applying?": "¿Por qué no se aplica mi modo de pantalla?",
    "Ensure you have clicked the \"APPLY\" button in the bottom right corner of the Display Modes screen.": "Asegúrese de haber hecho clic en el botón \"APLICAR\" en la esquina inferior derecha de la pantalla Modos de Pantalla.",
    "How to reset all settings?": "¿Cómo restablecer todos los ajustes?",
    "Go to Customization > Options. Scroll to the bottom and click the red RESET ALL SETTINGS button. This cannot be undone.": "Vaya a Personalización > Opciones. Desplácese hasta abajo y haga clic en el botón rojo RESTABLECER AJUSTES. Esto no se puede deshacer.",
    "Is this app safe to use?": "¿Es segura esta aplicación?",
    "Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files.": "Tactical funciona como una superposición visual y no accede a la memoria del juego ni modifica archivos del juego.",
    "How to change crosshair position?": "¿Cómo cambiar la posición de la retícula?",
    "Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset.": "Vaya a Posición y Tamaño en la barra lateral. Use los controles deslizantes X/Y para ajustar el desplazamiento.",
    "STILL NEED HELP?": "¿SIGUES NECESITANDO AYUDA?",
    "Join our community server for support and configuration tips.": "Únete a nuestro servidor comunitario para obtener soporte y consejos de configuración.",
    "JOIN DISCORD SERVER": "UNIRSE AL SERVIDOR DE DISCORD",
    "Crosshair name:": "Nombre del punto de mira:",
    "Custom": "Personalizado",
    "SVG path data (d attribute):": "Datos de la ruta SVG (atributo d):",
    "Reset all settings to defaults?": "¿Restablecer todos los ajustes a los valores predeterminados?"
  },
  fr: {
    "Tactical HUD": "Tactical HUD",
    "Display Modes": "Modes d'Affichage",
    "Crosshairs": "Viseurs",
    "Position & Size": "Position et Taille",
    "Options": "Options",
    "Help": "Aide",
    "Help & Documentation": "Aide et Documentation",
    "Essentials": "Essentiels",
    "Customization": "Personnalisation",
    "Support": "Assistance",
    "Hidden": "Caché",
    "System Override Active": "Remplacement Système Actif",
    "Hardware acceleration conflicts detected. Performance may be degraded until resolved in Options.": "Conflits d'accélération matérielle détectés. Les performances peuvent être réduites jusqu'à résolution dans Options.",
    "Rendering Mode": "Mode de Rendu",
    "Select how the tactical overlay integrates with your game client.": "Sélectionnez comment la superposition tactique s'intègre à votre client de jeu.",
    "Fullscreen": "Plein Écran",
    "Windowed": "Fenêtré",
    "Overlay": "Superposition",
    "Target Resolution": "Résolution Cible",
    "Match this to your in-game resolution.": "Faites correspondre à la résolution de votre jeu.",
    "Performance": "Performances",
    "Limit overlay framerate to conserve GPU resources.": "Limitez les fps de la superposition pour économiser les ressources GPU.",
    "Framerate Cap": "Limite de FPS",
    "FPS": "FPS",
    "Apply": "Appliquer",
    "Select, customize, and preview your reticle": "Sélectionnez, personnalisez et prévisualisez votre viseur",
    "Upload": "Importer",
    "Overlay Calibration": "Calibrage de la Superposition",
    "Fine-tune the positioning and scaling relative to your primary display.": "Ajustez le positionnement et l'échelle par rapport à votre écran principal.",
    "X-Axis Offset": "Décalage Axe X",
    "Horizontal alignment from center": "Alignement horizontal depuis le centre",
    "Y-Axis Offset": "Décalage Axe Y",
    "Vertical alignment from center": "Alignement vertical depuis le centre",
    "Global Scale": "Échelle Globale",
    "Overall size of the overlay elements": "Taille globale des éléments de la superposition",
    "Quick Align Presets": "Préréglages d'Alignement Rapide",
    "Center All": "Centrer Tout",
    "Top Edge": "Bord Supérieur",
    "Bottom Edge": "Bord Inférieur",
    "Reset to Default": "Rétablir les Valeurs",
    "System Behaviors": "Comportements Système",
    "Start with Windows": "Démarrer avec Windows",
    "Automatically launch when system boots.": "Lancement automatique au démarrage du système.",
    "Hardware Acceleration": "Accélération Matérielle",
    "Use GPU to render interface.": "Utiliser le GPU pour le rendu de l'interface.",
    "Localization": "Langue",
    "Display Language": "Langue d'Affichage",
    "Danger Zone": "Zone de Danger",
    "Reset All Settings": "Réinitialiser tous les Paramètres",
    "Permanently reset all configurations to factory defaults.": "Réinitialise définitivement toutes les configurations aux valeurs d'usine.",
    "Reset Defaults": "Rétablir les Valeurs",
    "SEARCH DOCUMENTATION...": "RECHERCHER DANS LA DOCUMENTATION...",
    "FREQUENTLY ASKED QUESTIONS": "FOIRE AUX QUESTIONS",
    "How do I change my crosshair?": "Comment changer mon viseur ?",
    "Navigate to the Crosshairs section in the Essentials menu. Browse the gallery and click any card to instantly apply it.": "Accédez à la section Viseurs dans le menu Essentiels. Parcourez la galerie et cliquez sur une carte pour l'appliquer.",
    "Why isn't my display mode applying?": "Pourquoi mon mode d'affichage ne s'applique-t-il pas ?",
    "Ensure you have clicked the \"APPLY\" button in the bottom right corner of the Display Modes screen.": "Assurez-vous d'avoir cliqué sur le bouton \"APPLIQUER\" dans le coin inférieur droit de l'écran Modes d'Affichage.",
    "How to reset all settings?": "Comment réinitialiser tous les paramètres ?",
    "Go to Customization > Options. Scroll to the bottom and click the red RESET ALL SETTINGS button. This cannot be undone.": "Accédez à Personnalisation > Options. Faites défiler vers le bas et cliquez sur le bouton rouge RÉINITIALISER TOUS LES PARAMÈTRES. Cette action est irréversible.",
    "Is this app safe to use?": "Cette application est-elle sûre ?",
    "Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files.": "Tactical fonctionne comme une superposition visuelle et ne s'insère pas dans la mémoire du jeu ni ne modifie les fichiers du jeu.",
    "How to change crosshair position?": "Comment changer la position du viseur ?",
    "Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset.": "Accédez à Position et Taille dans la barre latérale. Utilisez les curseurs X/Y pour ajuster le décalage.",
    "STILL NEED HELP?": "ENCORE BESOIN D'AIDE ?",
    "Join our community server for support and configuration tips.": "Rejoignez notre serveur communautaire pour obtenir de l'aide et des conseils de configuration.",
    "JOIN DISCORD SERVER": "REJOINDRE LE SERVEUR DISCORD",
    "Crosshair name:": "Nom du viseur :",
    "Custom": "Personnalisé",
    "SVG path data (d attribute):": "Données du chemin SVG (attribut d) :",
    "Reset all settings to defaults?": "Réinitialiser tous les paramètres par défaut ?"
  },
  de: {
    "Tactical HUD": "Tactical HUD",
    "Display Modes": "Anzeigemodi",
    "Crosshairs": "Fadenkreuze",
    "Position & Size": "Position und Größe",
    "Options": "Optionen",
    "Help": "Hilfe",
    "Help & Documentation": "Hilfe und Dokumentation",
    "Essentials": "Grundlagen",
    "Customization": "Anpassung",
    "Support": "Support",
    "Hidden": "Ausgeblendet",
    "System Override Active": "Systemüberschreibung Aktiv",
    "Hardware acceleration conflicts detected. Performance may be degraded until resolved in Options.": "Hardwarebeschleunigungskonflikte erkannt. Die Leistung kann beeinträchtigt sein, bis das Problem in den Optionen behoben wird.",
    "Rendering Mode": "Rendermodus",
    "Select how the tactical overlay integrates with your game client.": "Wählen Sie, wie das taktische Overlay in Ihren Spielclient integriert wird.",
    "Fullscreen": "Vollbild",
    "Windowed": "Fenstermodus",
    "Overlay": "Overlay",
    "Target Resolution": "Zielauflösung",
    "Match this to your in-game resolution.": "Stimmen Sie dies mit Ihrer Spielauflösung ab.",
    "Performance": "Leistung",
    "Limit overlay framerate to conserve GPU resources.": "Begrenzen Sie die FPS des Overlays, um GPU-Ressourcen zu schonen.",
    "Framerate Cap": "FPS-Limit",
    "FPS": "FPS",
    "Apply": "Übernehmen",
    "Select, customize, and preview your reticle": "Wählen, anpassen und Vorschau des Fadenkreuzes",
    "Upload": "Hochladen",
    "Overlay Calibration": "Overlay-Kalibrierung",
    "Fine-tune the positioning and scaling relative to your primary display.": "Feinabstimmung der Position und Skalierung relativ zu Ihrem Hauptbildschirm.",
    "X-Axis Offset": "X-Achsen-Versatz",
    "Horizontal alignment from center": "Horizontale Ausrichtung von der Mitte",
    "Y-Axis Offset": "Y-Achsen-Versatz",
    "Vertical alignment from center": "Vertikale Ausrichtung von der Mitte",
    "Global Scale": "Globale Skalierung",
    "Overall size of the overlay elements": "Gesamtgröße der Overlay-Elemente",
    "Quick Align Presets": "Schnellausrichtung-Voreinstellungen",
    "Center All": "Alles Zentrieren",
    "Top Edge": "Oberer Rand",
    "Bottom Edge": "Unterer Rand",
    "Reset to Default": "Auf Standard zurücksetzen",
    "System Behaviors": "Systemverhalten",
    "Start with Windows": "Mit Windows starten",
    "Automatically launch when system boots.": "Automatisch beim Systemstart ausführen.",
    "Hardware Acceleration": "Hardwarebeschleunigung",
    "Use GPU to render interface.": "GPU für die Darstellung der Oberfläche verwenden.",
    "Localization": "Sprache",
    "Display Language": "Anzeigesprache",
    "Danger Zone": "Gefahrenzone",
    "Reset All Settings": "Alle Einstellungen zurücksetzen",
    "Permanently reset all configurations to factory defaults.": "Setzt alle Konfigurationen dauerhaft auf die Werkseinstellungen zurück.",
    "Reset Defaults": "Standard wiederherstellen",
    "SEARCH DOCUMENTATION...": "DOKUMENTATION DURCHSUCHEN...",
    "FREQUENTLY ASKED QUESTIONS": "HÄUFIG GESTELLTE FRAGEN",
    "How do I change my crosshair?": "Wie ändere ich mein Fadenkreuz?",
    "Navigate to the Crosshairs section in the Essentials menu. Browse the gallery and click any card to instantly apply it.": "Navigieren Sie zum Bereich Fadenkreuze im Menü Grundlagen. Durchsuchen Sie die Galerie und klicken Sie auf eine Karte, um sie sofort anzuwenden.",
    "Why isn't my display mode applying?": "Warum wird mein Anzeigemodus nicht übernommen?",
    "Ensure you have clicked the \"APPLY\" button in the bottom right corner of the Display Modes screen.": "Stellen Sie sicher, dass Sie auf die Schaltfläche \"ÜBERNEHMEN\" in der unteren rechten Ecke des Bildschirms Anzeigemodi geklickt haben.",
    "How to reset all settings?": "Wie setze ich alle Einstellungen zurück?",
    "Go to Customization > Options. Scroll to the bottom and click the red RESET ALL SETTINGS button. This cannot be undone.": "Gehen Sie zu Anpassung > Optionen. Scrollen Sie nach unten und klicken Sie auf die rote Schaltfläche ALLE EINSTELLUNGEN ZURÜCKSETZEN. Dies kann nicht rückgängig gemacht werden.",
    "Is this app safe to use?": "Ist diese App sicher?",
    "Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files.": "Tactical fungiert ausschließlich als visuelles Overlay und greift nicht in den Spielspeicher ein oder ändert Spieldateien.",
    "How to change crosshair position?": "Wie ändere ich die Position des Fadenkreuzes?",
    "Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset.": "Navigieren Sie zu Position und Größe in der Seitenleiste. Verwenden Sie die X/Y-Schieberegler, um den Versatz anzupassen.",
    "STILL NEED HELP?": "NOCH FRAGEN?",
    "Join our community server for support and configuration tips.": "Treten Sie unserem Community-Server bei für Support und Konfigurationstipps.",
    "JOIN DISCORD SERVER": "DISCORD-SERVER BEITRETEN",
    "Crosshair name:": "Name des Fadenkreuzes:",
    "Custom": "Benutzerdefiniert",
    "SVG path data (d attribute):": "SVG-Pfaddaten (d-Attribut):",
    "Reset all settings to defaults?": "Alle Einstellungen zurücksetzen?"
  },
  ja: {
    "Tactical HUD": "Tactical HUD",
    "Display Modes": "表示モード",
    "Crosshairs": "クロスヘア",
    "Position & Size": "位置とサイズ",
    "Options": "オプション",
    "Help": "ヘルプ",
    "Help & Documentation": "ヘルプとドキュメント",
    "Essentials": "基本",
    "Customization": "カスタマイズ",
    "Support": "サポート",
    "Hidden": "非表示",
    "System Override Active": "システムオーバーライド有効",
    "Hardware acceleration conflicts detected. Performance may be degraded until resolved in Options.": "ハードウェアアクセラレーションの競合が検出されました。オプションで解決されるまでパフォーマンスが低下する可能性があります。",
    "Rendering Mode": "レンダリングモード",
    "Select how the tactical overlay integrates with your game client.": "戦術オーバーレイがゲームクライアントと統合する方法を選択します。",
    "Fullscreen": "フルスクリーン",
    "Windowed": "ウィンドウ",
    "Overlay": "オーバーレイ",
    "Target Resolution": "ターゲット解像度",
    "Match this to your in-game resolution.": "ゲーム内の解像度に合わせてください。",
    "Performance": "パフォーマンス",
    "Limit overlay framerate to conserve GPU resources.": "オーバーレイのFPSを制限してGPUリソースを節約します。",
    "Framerate Cap": "FPS制限",
    "FPS": "FPS",
    "Apply": "適用",
    "Select, customize, and preview your reticle": "照準を選択、カスタマイズ、プレビュー",
    "Upload": "アップロード",
    "Overlay Calibration": "オーバーレイキャリブレーション",
    "Fine-tune the positioning and scaling relative to your primary display.": "プライマリディスプレイに対する位置とスケールを微調整します。",
    "X-Axis Offset": "X軸オフセット",
    "Horizontal alignment from center": "中央からの水平方向の配置",
    "Y-Axis Offset": "Y軸オフセット",
    "Vertical alignment from center": "中央からの垂直方向の配置",
    "Global Scale": "グローバルスケール",
    "Overall size of the overlay elements": "オーバーレイ要素の全体的なサイズ",
    "Quick Align Presets": "クイック配置プリセット",
    "Center All": "すべて中央",
    "Top Edge": "上端",
    "Bottom Edge": "下端",
    "Reset to Default": "デフォルトにリセット",
    "System Behaviors": "システム動作",
    "Start with Windows": "Windowsとともに起動",
    "Automatically launch when system boots.": "システム起動時に自動的に起動します。",
    "Hardware Acceleration": "ハードウェアアクセラレーション",
    "Use GPU to render interface.": "GPUを使用してインターフェースをレンダリングします。",
    "Localization": "言語",
    "Display Language": "表示言語",
    "Danger Zone": "危険ゾーン",
    "Reset All Settings": "すべての設定をリセット",
    "Permanently reset all configurations to factory defaults.": "すべての設定を工場出荷時のデフォルトに完全にリセットします。",
    "Reset Defaults": "デフォルトに戻す",
    "SEARCH DOCUMENTATION...": "ドキュメントを検索...",
    "FREQUENTLY ASKED QUESTIONS": "よくある質問",
    "How do I change my crosshair?": "クロスヘアを変更するには？",
    "Navigate to the Crosshairs section in the Essentials menu. Browse the gallery and click any card to instantly apply it.": "基本メニューのクロスヘアセクションに移動します。ギャラリーを参照し、カードをクリックしてすぐに適用します。",
    "Why isn't my display mode applying?": "表示モードが適用されないのはなぜですか？",
    "Ensure you have clicked the \"APPLY\" button in the bottom right corner of the Display Modes screen.": "表示モード画面の右下にある「適用」ボタンをクリックしたことを確認してください。",
    "How to reset all settings?": "すべての設定をリセットするには？",
    "Go to Customization > Options. Scroll to the bottom and click the red RESET ALL SETTINGS button. This cannot be undone.": "カスタマイズ > オプションに移動します。一番下までスクロールし、赤い「すべての設定をリセット」ボタンをクリックします。この操作は元に戻せません。",
    "Is this app safe to use?": "このアプリは安全ですか？",
    "Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files.": "Tacticalは完全に視覚的なオーバーレイとして動作し、ゲームメモリにフックしたり、ゲームファイルを変更したりしません。",
    "How to change crosshair position?": "クロスヘアの位置を変更するには？",
    "Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset.": "サイドバーの「位置とサイズ」に移動します。X/Yスライダーを使用してオフセットを微調整します。",
    "STILL NEED HELP?": "まだヘルプが必要ですか？",
    "Join our community server for support and configuration tips.": "サポートと設定のヒントについては、コミュニティサーバーに参加してください。",
    "JOIN DISCORD SERVER": "DISCORDサーバーに参加",
    "Crosshair name:": "クロスヘア名:",
    "Custom": "カスタム",
    "SVG path data (d attribute):": "SVGパスデータ（d属性）:",
    "Reset all settings to defaults?": "すべての設定をデフォルトにリセットしますか？"
  }
};

function t(key) {
  const lang = appData?.settings?.language;
  if (lang && lang !== "en" && translations[lang]?.[key]) {
    return translations[lang][key];
  }
  return key;
}

function applyUILanguage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  const active = document.querySelector(".nav-link.active");
  if (active) {
    const screen = active.dataset.screen;
    document.getElementById("pageTitle").textContent = t(SCREENS[screen].title);
  }
}

// ─── State ───

let appData = null;

// ─── Router ───

const SCREENS = {
  "display-modes": { title: "Display Modes", render: renderDisplayModes },
  crosshairs: { title: "Crosshairs", render: renderCrosshairs },
  "position-size": { title: "Position & Size", render: renderPositionSize },
  options: { title: "Options", render: renderOptions },
  help: { title: "Help & Documentation", render: renderHelp },
};

function navigate(screen) {
  if (!SCREENS[screen]) screen = "display-modes";
  applyUILanguage();
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.screen === screen);
  });
  document.getElementById("pageTitle").textContent = t(SCREENS[screen].title);
  SCREENS[screen].render(document.getElementById("screenContent"));
}

// ─── Display Modes Screen ───

function renderDisplayModes(container) {
  container.innerHTML = `
    <div class="max-w-3xl flex flex-col gap-8 pb-20">
      <section class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">${t("Rendering Mode")}</h2>
          <p class="text-sm text-muted">${t("Select how the tactical overlay integrates with your game client.")}</p>
        </div>
        <div class="flex border border-border-color p-1 bg-surface" id="modeSelector">
          ${["fullscreen", "windowed", "overlay"].map((m) => `
            <label class="flex-1 text-center cursor-pointer">
              <input class="peer sr-only" type="radio" name="display-mode" value="${m}" />
              <div class="py-2 text-sm font-medium text-muted peer-checked:bg-primary peer-checked:text-background-dark transition-colors uppercase font-heading tracking-wide">${t(m.charAt(0).toUpperCase() + m.slice(1))}</div>
            </label>`).join("")}
        </div>
      </section>
      <hr class="border-border-color" />
      <section class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">${t("Target Resolution")}</h2>
          <p class="text-sm text-muted">${t("Match this to your in-game resolution.")}</p>
        </div>
        <div class="relative w-full max-w-md">
          <select id="resolutionSelect" class="w-full bg-surface border border-border-color text-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
            ${["1920x1080 (Native)", "2560x1440", "3840x2160", "1280x720"].map((r) => `<option value="${r.split(" ")[0]}">${r}</option>`).join("")}
          </select>
        </div>
      </section>
      <hr class="border-border-color" />
      <section class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <h2 class="font-heading font-semibold text-lg uppercase">${t("Performance")}</h2>
          <p class="text-sm text-muted">${t("Limit overlay framerate to conserve GPU resources.")}</p>
        </div>
        <div class="flex flex-col gap-4 max-w-md">
          <div class="flex justify-between items-center">
            <label class="text-sm">${t("Framerate Cap")}</label>
            <span class="text-sm font-heading font-bold text-primary" id="fpsDisplay">144 ${t("FPS")}</span>
          </div>
          <input type="range" id="fpsSlider" min="30" max="240" value="144" class="w-full" />
          <div class="flex justify-between text-xs text-muted"><span>30</span><span>240</span></div>
        </div>
      </section>
    </div>
    <div class="sticky bottom-0 py-4 flex justify-end bg-gradient-to-t from-background-dark via-background-dark to-transparent">
      <button id="applyDisplayBtn" class="w-[120px] h-[40px] bg-primary text-background-dark font-heading font-bold uppercase tracking-wide text-sm hover:brightness-110 transition-all border-none cursor-pointer">${t("Apply")}</button>
    </div>`;

  if (appData?.display_mode) {
    const d = appData.display_mode;
    const radio = container.querySelector(`input[value="${d.mode}"]`);
    if (radio) radio.checked = true;
    container.querySelector("#resolutionSelect").value = d.resolution;
    container.querySelector("#fpsSlider").value = d.framerate_cap;
    container.querySelector("#fpsDisplay").textContent = d.framerate_cap + " " + t("FPS");
  }

  container.querySelector("#fpsSlider").addEventListener("input", (e) => {
    container.querySelector("#fpsDisplay").textContent = e.target.value + " " + t("FPS");
  });

  container.querySelector("#applyDisplayBtn").addEventListener("click", async () => {
    const mode = container.querySelector("input[name='display-mode']:checked")?.value || "windowed";
    const resolution = container.querySelector("#resolutionSelect").value;
    const framerate_cap = parseInt(container.querySelector("#fpsSlider").value, 10);
    appData.display_mode = { mode, resolution, framerate_cap };
    await Native.saveDisplayMode({ mode, resolution, framerate_cap });
    const el = document.getElementById("contentArea");
    el.style.transition = "background 0.15s";
    el.style.background = "rgba(255,85,0,0.08)";
    setTimeout(() => { el.style.background = ""; }, 200);
  });
}

// ─── Crosshairs Screen ───

function renderCrosshairs(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-1 mb-8">
      <h2 class="font-heading text-3xl font-bold uppercase tracking-wide">${t("Crosshairs")}</h2>
      <p class="text-muted text-sm">${t("Select, customize, and preview your reticle")}</p>
    </div>
    <div class="grid grid-cols-4 gap-4 max-w-[800px]" id="crosshairGrid"></div>`;

  loadCrosshairGrid();
}

async function loadCrosshairGrid() {
  const grid = document.getElementById("crosshairGrid");
  if (!grid) return;
  const items = appData?.crosshairs || await Native.getCrosshairs() || [];
  if (!appData) appData = {};
  appData.crosshairs = items;

  grid.innerHTML = items.map((c) => `
    <button class="crosshair-card w-[120px] h-[120px] bg-surface border ${c.is_active ? "border-primary shadow-[inset_0_0_15px_rgba(255,85,0,0.1)]" : "border-border hover:border-muted"} flex items-center justify-center cursor-pointer group" data-id="${c.id}">
      <svg class="${c.is_active ? "text-primary" : "text-text group-hover:text-primary transition-colors"} w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="${c.svg_d || "M12 2L2 12l10 10 10-10L12 2z"}"></path></svg>
    </button>`).join("") + `
    <button id="uploadCrosshair" class="w-[120px] h-[120px] bg-transparent border border-dashed border-border flex flex-col items-center justify-center hover:border-primary hover:text-primary text-muted cursor-pointer transition-colors group">
      <span class="material-symbols-outlined text-2xl mb-1 group-hover:scale-110 transition-transform">add</span>
      <span class="text-[10px] uppercase font-bold tracking-wider">${t("Upload")}</span>
    </button>`;

  grid.querySelectorAll(".crosshair-card").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id, 10);
      await Native.activateCrosshair(id);
      for (const c of appData.crosshairs) c.is_active = c.id === id ? 1 : 0;
      syncState();
      loadCrosshairGrid();
    });
  });

  document.getElementById("uploadCrosshair")?.addEventListener("click", () => {
    const name = prompt(t("Crosshair name:"), t("Custom"));
    if (!name) return;
    const svg_d = prompt(t("SVG path data (d attribute):"), "M12 2v20M2 12h20");
    if (!svg_d) return;
    Native.addCrosshair(name, svg_d).then(() => {
      Native.getCrosshairs().then((items) => {
        appData.crosshairs = items;
        loadCrosshairGrid();
      });
    });
  });
}

// ─── Position & Size Screen ───

function renderPositionSize(container) {
  const pos = appData?.position || { x_offset: 0, y_offset: 0, scale: 1.0 };

  container.innerHTML = `
    <div class="flex flex-col gap-2 max-w-[800px] mb-8">
      <h3 class="font-heading text-xl font-bold uppercase tracking-wider">${t("Overlay Calibration")}</h3>
      <p class="text-muted text-sm">${t("Fine-tune the positioning and scaling relative to your primary display.")}</p>
    </div>
    <div class="flex flex-col gap-6 max-w-[800px]">
      ${renderAxisSlider(t("X-Axis Offset"), t("Horizontal alignment from center"), "xSlider", "xDisplay", "px", pos.x_offset, -100, 100)}
      ${renderAxisSlider(t("Y-Axis Offset"), t("Vertical alignment from center"), "ySlider", "yDisplay", "px", pos.y_offset, -100, 100)}
      ${renderAxisSlider(t("Global Scale"), t("Overall size of the overlay elements"), "scaleSlider", "scaleDisplay", "x", pos.scale, 0.5, 2.0, 0.1)}
      <div class="mt-4 flex flex-col gap-3">
        <label class="font-heading text-sm font-bold uppercase tracking-wide">${t("Quick Align Presets")}</label>
        <div class="grid grid-cols-3 gap-4">
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider" data-x="0" data-y="0">${t("Center All")}</button>
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider" data-x="0" data-y="-100">${t("Top Edge")}</button>
          <button class="align-preset h-[40px] bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors text-sm font-bold uppercase font-heading tracking-wider" data-x="0" data-y="100">${t("Bottom Edge")}</button>
        </div>
      </div>
      <div class="mt-8 flex justify-end gap-4 pt-6 border-t border-border">
        <button id="resetPosBtn" class="h-[40px] px-6 bg-transparent border border-border text-text-main hover:bg-surface-hover transition-colors font-heading uppercase font-bold tracking-wider text-sm cursor-pointer">${t("Reset to Default")}</button>
        <button id="applyPosBtn" class="h-[40px] w-[120px] bg-primary text-background-dark hover:brightness-125 transition-all font-heading uppercase font-bold tracking-wider text-base shadow-glow cursor-pointer">${t("Apply")}</button>
      </div>
    </div>`;

  wireSlider("xSlider", "xDisplay", "px");
  wireSlider("ySlider", "yDisplay", "px");
  wireSlider("scaleSlider", "scaleDisplay", "x");

  document.querySelectorAll(".align-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("xSlider").value = btn.dataset.x;
      document.getElementById("ySlider").value = btn.dataset.y;
      updateSliderDisplay("xSlider", "xDisplay", "px");
      updateSliderDisplay("ySlider", "yDisplay", "px");
    });
  });

  document.getElementById("resetPosBtn").addEventListener("click", async () => {
    const r = await Native.resetPosition() || { x_offset: 0, y_offset: 0, scale: 1.0 };
    document.getElementById("xSlider").value = r.x_offset;
    document.getElementById("ySlider").value = r.y_offset;
    document.getElementById("scaleSlider").value = r.scale;
    updateSliderDisplay("xSlider", "xDisplay", "px");
    updateSliderDisplay("ySlider", "yDisplay", "px");
    updateSliderDisplay("scaleSlider", "scaleDisplay", "x");
    if (appData) appData.position = { x_offset: r.x_offset, y_offset: r.y_offset, scale: r.scale };
    syncState();
  });

  document.getElementById("applyPosBtn").addEventListener("click", async () => {
    const posData = {
      x_offset: parseInt(document.getElementById("xSlider").value, 10),
      y_offset: parseInt(document.getElementById("ySlider").value, 10),
      scale: parseFloat(document.getElementById("scaleSlider").value),
    };
    appData.position = posData;
    await Native.savePosition(posData);
  });
}

function renderAxisSlider(label, desc, sliderId, displayId, suffix, val, min, max, step) {
  step = step || 1;
  const pct = ((val - min) / (max - min)) * 100;
  const displayVal = suffix === "x" ? val + "x" : val + suffix;
  return `<div class="bg-surface border border-border p-6 flex flex-col gap-4">
    <div class="flex justify-between items-center w-full">
      <div class="flex flex-col">
        <label class="font-heading text-base font-bold uppercase tracking-wide">${label}</label>
        <span class="text-muted text-xs">${desc}</span>
      </div>
      <div class="bg-background-dark border border-border px-3 py-1 min-w-[60px] text-center">
        <span class="text-primary font-bold" id="${displayId}">${displayVal}</span>
      </div>
    </div>
    <div class="flex items-center gap-4 mt-2">
      <span class="text-muted text-xs">${min}</span>
      <div class="flex-1 relative h-6 flex items-center">
        <div class="absolute w-full h-[4px] bg-border-color"></div>
        <div class="absolute h-[4px] bg-primary left-0" id="${sliderId}Fill" style="width:${pct}%"></div>
        <input type="range" id="${sliderId}" min="${min}" max="${max}" step="${step}" value="${val}" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div class="absolute h-4 w-4 bg-text-main border border-border shadow-glow" id="${sliderId}Thumb" style="left:${pct}%;transform:translateX(-50%)"></div>
      </div>
      <span class="text-muted text-xs">${max}</span>
    </div>
  </div>`;
}

function wireSlider(sliderId, displayId, suffix) {
  const slider = document.getElementById(sliderId);
  slider.addEventListener("input", () => updateSliderDisplay(sliderId, displayId, suffix));
}

function updateSliderDisplay(sliderId, displayId, suffix) {
  const slider = document.getElementById(sliderId);
  const val = parseFloat(slider.value);
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const pct = ((val - min) / (max - min)) * 100;
  document.getElementById(displayId).textContent = suffix === "x" ? val + "x" : val + suffix;
  const fill = document.getElementById(sliderId + "Fill");
  if (fill) fill.style.width = pct + "%";
  const thumb = document.getElementById(sliderId + "Thumb");
  if (thumb) thumb.style.left = pct + "%";
}

// ─── Options Screen ───

function renderOptions(container) {
  const s = appData?.settings || {};

  container.innerHTML = `
    <div class="max-w-5xl mx-auto">
      <div class="mb-10">
        <h3 class="text-muted font-heading uppercase tracking-wider text-sm mb-6 border-b border-border pb-2">${t("System Behaviors")}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${renderToggleCard(t("Start with Windows"), t("Automatically launch when system boots."), "start_with_windows", !!s.start_with_windows)}
          ${renderToggleCard(t("Hardware Acceleration"), t("Use GPU to render interface."), "hardware_acceleration", !!s.hardware_acceleration)}
        </div>
      </div>
      <div class="mb-10">
        <h3 class="text-muted font-heading uppercase tracking-wider text-sm mb-6 border-b border-border pb-2">${t("Localization")}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-surface border border-border p-5 flex flex-col justify-center hover:border-muted transition-colors">
            <label class="font-medium text-base mb-3">${t("Display Language")}</label>
            <div class="relative">
              <select id="langSelect" onchange="window.onLangChange(this)" class="block w-full appearance-none border border-border bg-background-dark py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
                ${[["en", "English (US)"], ["vi", "Tiếng Việt"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["ja", "日本語"]].map(([v, l]) => `<option value="${v}" ${s.language === v ? "selected" : ""}>${l}</option>`).join("")}
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted"><span class="material-symbols-outlined text-[20px]">expand_more</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-10 mt-16">
        <h3 class="text-danger font-heading uppercase tracking-wider text-sm mb-6 border-b border-danger/30 pb-2">${t("Danger Zone")}</h3>
        <div class="bg-surface border border-danger/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex flex-col max-w-lg">
            <span class="font-medium text-base mb-1">${t("Reset All Settings")}</span>
            <span class="text-muted text-sm">${t("Permanently reset all configurations to factory defaults.")}</span>
          </div>
          <button id="resetSettingsBtn" class="btn-danger shrink-0 inline-flex items-center justify-center px-6 py-2.5 font-heading uppercase tracking-widest text-base font-bold cursor-pointer">${t("Reset Defaults")}</button>
        </div>
      </div>
    </div>`;

  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.key;
      const active = btn.classList.contains("bg-primary/20");
      await Native.saveSetting(key, !active);
      if (appData?.settings) appData.settings[key] = !active;
      applyToggleState(btn, !active);
    });
  });

  document.getElementById("resetSettingsBtn")?.addEventListener("click", async () => {
    if (!confirm(t("Reset all settings to defaults?"))) return;
    await Native.saveSetting("reset", "true");
    appData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    storeSave(appData);
    const current = document.querySelector(".nav-link.active")?.dataset.screen || "display-modes";
    navigate(current);
  });
}

function renderToggleCard(title, desc, key, active) {
  return `<div class="bg-surface border border-border p-5 flex items-center justify-between hover:border-muted transition-colors">
    <div class="flex flex-col pr-4">
      <span class="font-medium text-base mb-1">${title}</span>
      <span class="text-muted text-sm">${desc}</span>
    </div>
    <button class="toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border transition-colors duration-200 focus:outline-none ${active ? "border-primary bg-primary/20 shadow-[inset_0_0_10px_rgba(249,87,6,0.2)] shadow-glow" : "border-border bg-background-dark hover:border-muted"}" data-key="${key}" role="switch">
      <span class="toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm shadow ring-0 transition duration-200 ${active ? "translate-x-5 bg-primary" : "translate-x-0 bg-muted"}"></span>
    </button>
  </div>`;
}

function applyToggleState(btn, active) {
  if (active) {
    btn.className = "toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border border-primary bg-primary/20 transition-colors duration-200 focus:outline-none shadow-[inset_0_0_10px_rgba(249,87,6,0.2)] shadow-glow";
    btn.querySelector(".toggle-knob").className = "toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-primary shadow ring-0 transition duration-200 translate-x-5";
  } else {
    btn.className = "toggle-btn relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border border-border bg-background-dark transition-colors duration-200 focus:outline-none hover:border-muted";
    btn.querySelector(".toggle-knob").className = "toggle-knob pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-muted shadow ring-0 transition duration-200 translate-x-0";
  }
}

// ─── Help Screen ───

function renderHelp(container) {
  container.innerHTML = `
    <div class="max-w-[800px] mx-auto w-full flex flex-col gap-8 pb-12">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span class="material-symbols-outlined text-muted">search</span>
        </div>
        <input class="w-full h-12 pl-12 pr-4 bg-surface border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted" placeholder="${t("SEARCH DOCUMENTATION...")}" type="text" id="helpSearch" />
      </div>
      <div class="flex flex-col gap-2" id="faqList">
        <h3 class="font-heading text-xl text-muted mb-2 border-b border-border pb-2">${t("FREQUENTLY ASKED QUESTIONS")}</h3>
        ${renderFaq(t("How do I change my crosshair?"), t("Navigate to the Crosshairs section in the Essentials menu. Browse the gallery and click any card to instantly apply it."))}
        ${renderFaq(t("Why isn't my display mode applying?"), t("Ensure you have clicked the \"APPLY\" button in the bottom right corner of the Display Modes screen."))}
        ${renderFaq(t("How to reset all settings?"), t("Go to Customization > Options. Scroll to the bottom and click the red RESET ALL SETTINGS button. This cannot be undone."))}
        ${renderFaq(t("Is this app safe to use?"), t("Tactical operates entirely as a visual overlay and does not hook into game memory or modify game files."))}
        ${renderFaq(t("How to change crosshair position?"), t("Navigate to Position & Size in the sidebar. Use the X/Y sliders to fine-tune the offset."))}
      </div>
      <div class="mt-8 bg-surface border border-border p-8 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-[#5865F2]/10 flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-[#5865F2] text-3xl">support_agent</span>
        </div>
        <h3 class="font-heading text-2xl mb-2">${t("STILL NEED HELP?")}</h3>
        <p class="text-muted text-sm mb-6 max-w-md">${t("Join our community server for support and configuration tips.")}</p>
        <button class="bg-[#5865F2] hover:bg-[#4752C4] text-white font-heading text-lg px-8 py-3 transition-colors flex items-center gap-2 cursor-pointer">
          ${t("JOIN DISCORD SERVER")} <span class="material-symbols-outlined text-sm">open_in_new</span>
        </button>
      </div>
    </div>`;

  document.getElementById("helpSearch")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".faq-item").forEach((el) => {
      el.style.display = el.querySelector("summary span").textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

function renderFaq(question, answer) {
  return `<details class="faq-item group bg-surface border border-border">
    <summary class="flex items-center justify-between h-14 px-4 cursor-pointer hover:bg-surface-hover transition-colors">
      <span class="font-medium text-text-main text-sm">${question}</span>
      <span class="material-symbols-outlined text-muted group-open:rotate-45 transition-transform duration-200">add</span>
    </summary>
    <div class="px-4 pb-4 pt-2 text-sm text-muted border-t border-border/50">${answer}</div>
  </details>`;
}

// ─── Init ───

document.addEventListener("DOMContentLoaded", async () => {
  // Load data from Native bridge (C++) or localStorage (dev mode)
  appData = await Native.getData();
  if (!appData) {
    appData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    storeSave(appData);
  }

  // Apply saved language to static UI
  applyUILanguage();

  // Warning dismiss
  document.getElementById("dismissWarning").addEventListener("click", () => {
    const banner = document.getElementById("warningBanner");
    banner.style.opacity = "0";
    banner.style.maxHeight = "0";
    banner.style.margin = "0";
    banner.style.padding = "0";
    banner.style.overflow = "hidden";
    setTimeout(() => banner.remove(), 300);
  });

  // Hidden toggle
  const hiddenToggle = document.getElementById("hiddenToggle");
  if (appData?.settings) {
    hiddenToggle.checked = !!appData.settings.hidden;
  }
  hiddenToggle.addEventListener("change", () => {
    Native.saveSetting("hidden", !!hiddenToggle.checked);
    if (appData?.settings) appData.settings.hidden = !!hiddenToggle.checked;
  });

  // Nav clicks
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.addEventListener("click", () => navigate(a.dataset.screen));
  });

  // ─── Custom Title Bar Controls ───

  async function updateMaxBtn() {
    const isMax = await Native.isMaximized();
    document.getElementById("maximize-icon").textContent = isMax ? "filter_none" : "check_box_outline_blank";
  }

  document.getElementById("btn-minimize").addEventListener("click", () => {
    Native.minimizeWindow();
  });
  document.getElementById("btn-maximize").addEventListener("click", async () => {
    await Native.maximizeWindow();
    updateMaxBtn();
  });
  document.getElementById("btn-close").addEventListener("click", () => {
    Native.closeWindow();
  });

  // Drag window by tracking mouse movement in JS (reliable with WebView2)
  let isDragging = false;
  let lastScreenX = 0, lastScreenY = 0;
  const titlebar = document.getElementById("titlebar");

  titlebar.addEventListener("mousedown", (e) => {
    if (e.target.closest("#window-controls")) return;
    isDragging = true;
    lastScreenX = e.screenX;
    lastScreenY = e.screenY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.screenX - lastScreenX;
    const dy = e.screenY - lastScreenY;
    if (dx !== 0 || dy !== 0) {
      Native.moveWindowBy(dx, dy);
      lastScreenX = e.screenX;
      lastScreenY = e.screenY;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Double-click title bar to maximize/restore
  titlebar.addEventListener("dblclick", (e) => {
    if (e.target.closest("#window-controls")) return;
    Native.maximizeWindow().then(() => updateMaxBtn());
  });

  // Update maximize icon when window resizes (e.g. Win+Up keyboard shortcut)
  let resizePending = false;
  window.addEventListener("resize", () => {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(async () => {
      resizePending = false;
      const isMax = await Native.isMaximized();
      document.getElementById("maximize-icon").textContent = isMax ? "filter_none" : "check_box_outline_blank";
    });
  });

  // Initial maximize icon state
  updateMaxBtn();

  // Global function for inline onchange
  window.onLangChange = async (select) => {
    const newLang = select.value;
    await Native.saveSetting("language", newLang);
    if (!appData) appData = { settings: {} };
    if (!appData.settings) appData.settings = {};
    appData.settings.language = newLang;
    const current = document.querySelector(".nav-link.active")?.dataset.screen || "display-modes";
    navigate(current);
  };

  // Default screen
  navigate("display-modes");
});
