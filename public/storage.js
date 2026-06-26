// ================================================================
// Storage Helper - Web Version
// Uses localStorage for persistence (no Electron file system)
// ================================================================

class GameStorage {
  constructor() {
    this._sessionKey = 'dsng_api_config';
    this._sessionState = 'dsng_game_state';
    this._slotPrefix = 'dsng_slot_';
    this._configKey = 'dsng_world_config';
  }

  // ─── API Config (session-only, cleared on tab close) ───
  saveApiConfig(provider, apiKeys, writerKeys) {
    const config = { provider, apiKeys: Array.isArray(apiKeys) ? apiKeys : [apiKeys] };
    if (writerKeys && Array.isArray(writerKeys)) {
      config.writerKeys = writerKeys;
    }
    sessionStorage.setItem(this._sessionKey, JSON.stringify(config));
  }

  loadApiConfig() {
    const raw = sessionStorage.getItem(this._sessionKey);
    if (raw) {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }

  clearApiConfig() {
    sessionStorage.removeItem(this._sessionKey);
  }

  // ─── Game State (in-memory during play) ───
  saveCurrentState(state) {
    sessionStorage.setItem(this._sessionState, JSON.stringify(state));
  }

  loadCurrentState() {
    const raw = sessionStorage.getItem(this._sessionState);
    if (raw) {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }

  clearCurrentState() {
    sessionStorage.removeItem(this._sessionState);
  }

  // ─── Save Slots (localStorage) ───
  async saveToSlot(slotName, state) {
    try {
      const key = this._slotPrefix + slotName;
      localStorage.setItem(key, JSON.stringify(state));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async loadFromSlot(slotName) {
    try {
      const key = this._slotPrefix + slotName;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async listSlots() {
    try {
      const slots = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this._slotPrefix)) {
          const raw = localStorage.getItem(key);
          const name = key.replace(this._slotPrefix, '');
          let modified = '';
          try {
            const data = JSON.parse(raw);
            modified = data._savedAt || '';
          } catch {}
          slots.push({ name, size: raw.length, modified });
        }
      }
      // Sort by name
      slots.sort((a, b) => a.name.localeCompare(b.name));
      return { success: true, slots };
    } catch (e) {
      return { success: false, error: e.message, slots: [] };
    }
  }

  async deleteSlot(slotName) {
    try {
      const key = this._slotPrefix + slotName;
      localStorage.removeItem(key);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ─── File Export / Import (web: download/upload) ───
  async exportToFile(stateData, defaultName) {
    try {
      const json = JSON.stringify(stateData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName || 'novel-save.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async importFromFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            resolve(data);
          } catch {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      input.click();
    });
  }

  // ─── World Config (Save = download .json file, Load = open file picker) ───
  async saveWorldConfig(data) {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'world-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Also save to localStorage as fallback
      localStorage.setItem(this._configKey, json);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async loadWorldConfig() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          // Also cache to localStorage
          localStorage.setItem(this._configKey, text);
          resolve(data);
        } catch {
          resolve(null);
        }
      };
      // Handle user canceling the dialog
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  // ─── Export Story as .doc (web: download as .html) ───
  async exportStoryDoc(htmlContent, fileName) {
    try {
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'truyen.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ─── Error Logging (web: console only) ───
  async logError(message) {
    console.error('[ERROR LOG]', message);
    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('dsng_error_logs') || '[]');
      logs.push({ timestamp: new Date().toISOString(), message });
      // Keep only last 50 entries
      if (logs.length > 50) logs.shift();
      localStorage.setItem('dsng_error_logs', JSON.stringify(logs));
    } catch {}
  }

  async getLogPath() {
    return 'Browser Console (F12) + localStorage:dsng_error_logs';
  }
}

window.gameStorage = new GameStorage();
