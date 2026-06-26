// ================================================================
// DeepSeek Novel Game - Main Application Logic (Web Version)
// Adapted from Electron app.js - replaces IPC calls with web APIs
// ================================================================

(function () {
  'use strict';

  // ──────────── State ────────────
  const state = {
    screen: 'main-menu',
    gameWorld: null,
    gameCharacter: null,
    storyTitle: '',
    storyHistory: [],
    storyHTML: [],
    journal: [],
    characterStatuses: [],
    turnCount: 0,
    hasUnsavedChanges: false,
    menuOpen: false,
    searchResults: [],
    searchIndex: 0,
  };

  // ──────────── Genre Tags ────────────
  const GENRE_TAGS = [
    'Kỳ Ảo', 'Khoa Học Viễn Tưởng', 'Kinh Dị', 'Lãng Mạn', 'Phiêu Lưu',
    'Trinh Thám', 'Hậu Tận Thế', 'Võng Du', 'Huyền Huyễn', 'Đô Thị',
    'Lịch Sử', 'Hài Hước',
  ];

  const STYLE_TAGS = [
    'Văn Học', 'Light Novel', 'Điện Ảnh', 'Hài Hước', 'Bi Kịch',
    'Hành Động', 'Trữ Tình', 'Kịch Tính', 'Tu Tiên', 'Hiện Đại',
  ];

  const GENDER_TAGS = ['Nam', 'Nữ', 'Khác'];

  const PERSONALITY_TAGS = [
    'Dũng Cảm', 'Thông Minh', 'Nhút Nhát', 'Nóng Tính', 'Lạnh Lùng',
    'Hài Hước', 'Tốt Bụng', 'Xảo Quyệt', 'Kiêu Ngạo', 'Khiêm Tốn',
    'Tò Mò', 'Liều Lĩnh',
  ];

  const DIFFICULTY_LABELS = ['', 'Dễ', 'Bình Thường', 'Khó', 'Ác Mộng', 'Địa Ngục'];

  // ──────────── Custom Confirm Dialog ────────────
  function showConfirm(message, title = 'Xác Nhận') {
    return new Promise((resolve) => {
      document.getElementById('confirm-dialog-title').textContent = title;
      document.getElementById('confirm-dialog-message').textContent = message;
      document.getElementById('confirm-dialog-overlay').style.display = 'flex';

      const okBtn = document.getElementById('btn-confirm-ok');
      const cancelBtn = document.getElementById('btn-confirm-cancel');

      function cleanup(result) {
        document.getElementById('confirm-dialog-overlay').style.display = 'none';
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      }

      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  }

  // ──────────── Screen Navigation ────────────
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
    });

    const screen = document.getElementById(`screen-${name}`);
    if (screen) {
      screen.classList.add('active');
      if (name === 'game') {
        screen.style.display = 'flex';
      }
    }
    state.screen = name;

    // Hide global theme toggle on game screen (game has its own)
    const globalToggle = document.getElementById('btn-theme-toggle');
    if (globalToggle) {
      globalToggle.style.display = (name === 'game') ? 'none' : '';
    }

    if (screen && (name === 'new-game' || name === 'api-settings')) {
      setTimeout(() => {
        const firstInput = screen.querySelector('input:not([type="hidden"]):not([type="checkbox"]), textarea');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }

  // ──────────── Toast Notifications ────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 7000);
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN MENU
  // ═══════════════════════════════════════════════════════════

  function initMainMenu() {
    document.getElementById('btn-new-game').addEventListener('click', () => {
      const config = window.gameStorage.loadApiConfig();
      const keys = Array.isArray(config?.apiKeys) ? config.apiKeys : (config?.apiKey ? [config.apiKey] : []);
      if (!config || keys.length === 0) {
        showToast('Vui lòng cấu hình API Key trước!', 'warning');
        showScreen('api-settings');
        return;
      }
      window.novelAI.setConfig(config.provider, keys);
      resetNewGameForm();
      showScreen('new-game');
    });

    document.getElementById('btn-load-game').addEventListener('click', () => {
      showScreen('load-game');
      loadSaveSlots();
    });

    document.getElementById('btn-api-settings').addEventListener('click', () => {
      loadApiSettings();
      showScreen('api-settings');
    });
  }

  // ═══════════════════════════════════════════════════════════
  // API SETTINGS
  // ═══════════════════════════════════════════════════════════

  function loadApiSettings() {
    const config = window.gameStorage.loadApiConfig();
    if (config) {
      document.getElementById('api-provider').value = config.provider;
      const keys = Array.isArray(config.apiKeys) ? config.apiKeys : (config.apiKey ? [config.apiKey] : []);
      document.getElementById('api-key').value = keys.join('\n');
      updateApiKeyPlaceholder();
    }
    document.getElementById('api-test-result').style.display = 'none';
  }

  function updateApiKeyPlaceholder() {
    const provider = document.getElementById('api-provider').value;
    const input = document.getElementById('api-key');
    input.placeholder = provider === 'deepseek' ? 'sk-...' : 'AIza...';
    document.getElementById('help-deepseek').style.display = provider === 'deepseek' ? 'block' : 'none';
    document.getElementById('help-gemini').style.display = provider === 'gemini' ? 'block' : 'none';
  }

  function initApiSettings() {
    document.getElementById('api-provider').addEventListener('change', updateApiKeyPlaceholder);

    document.getElementById('btn-toggle-api-key').addEventListener('click', () => {
      const input = document.getElementById('api-key');
      const btn = document.getElementById('btn-toggle-api-key');
      if (input.dataset.visible === 'true') {
        input.style.webkitTextSecurity = 'disc';
        input.style.textSecurity = 'disc';
        input.dataset.visible = 'false';
        btn.textContent = '👁 Hiện';
      } else {
        input.style.webkitTextSecurity = 'none';
        input.style.textSecurity = 'none';
        input.dataset.visible = 'true';
        btn.textContent = '🙈 Ẩn';
      }
    });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const provider = document.getElementById('api-provider').value;
      const apiKeyRaw = document.getElementById('api-key')?.value?.trim();
      if (!apiKeyRaw) {
        showToast('Vui lòng nhập ít nhất 1 API Key', 'warning');
        return;
      }
      const apiKeys = apiKeyRaw.split('\n').map(k => k.trim()).filter(k => k.length > 0);
      if (apiKeys.length === 0) {
        showToast('Vui lòng nhập ít nhất 1 API Key hợp lệ', 'warning');
        return;
      }
      window.gameStorage.saveApiConfig(provider, apiKeys);
      window.novelAI.setConfig(provider, apiKeys);
      showToast(`Đã lưu ${apiKeys.length} API key!`, 'success');
    });

    document.getElementById('btn-test-api').addEventListener('click', async () => {
      const provider = document.getElementById('api-provider').value;
      const apiKeyRaw = document.getElementById('api-key')?.value?.trim();
      if (!apiKeyRaw) {
        showToast('Vui lòng nhập ít nhất 1 API Key', 'warning');
        return;
      }
      const apiKeys = apiKeyRaw.split('\n').map(k => k.trim()).filter(k => k.length > 0);
      const resultEl = document.getElementById('api-test-result');
      resultEl.style.display = 'block';
      resultEl.textContent = `⏳ Đang kiểm tra ${apiKeys.length} key...`;
      resultEl.className = 'api-test-result';
      window.novelAI.setConfig(provider, apiKeys);
      try {
        const result = await window.novelAI.testConnection();
        resultEl.textContent = `✅ Key #${(result.keyIndex || 0) + 1}/${apiKeys.length} hoạt động! ${result.message}`;
        resultEl.className = 'api-test-result success';
        window.gameStorage.saveApiConfig(provider, apiKeys);
      } catch (e) {
        resultEl.textContent = `❌ Thất bại: ${e.message}`;
        resultEl.className = 'api-test-result error';
        await window.gameStorage.logError(`API test failed (${provider}): ${e.message}`);
      }
    });

    document.getElementById('btn-back-from-settings').addEventListener('click', () => {
      showScreen('main-menu');
    });
  }

  // ═══════════════════════════════════════════════════════════
  // NEW GAME - Tag Systems
  // ═══════════════════════════════════════════════════════════

  function initTagContainer(containerId, tags, multiSelect = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    tags.forEach(tag => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.textContent = tag;
      el.dataset.value = tag;
      el.addEventListener('click', () => {
        if (multiSelect) {
          el.classList.toggle('selected');
        } else {
          container.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
          el.classList.add('selected');
        }
      });
      container.appendChild(el);
    });
  }

  function getSelectedTags(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const selected = container.querySelectorAll('.tag.selected');
    return Array.from(selected).map(t => t.dataset.value);
  }

  function addTagToContainer(containerId, value, multiSelect = true) {
    if (!value || !value.trim()) return;
    const container = document.getElementById(containerId);
    if (!container) return;
    const existing = container.querySelectorAll('.tag');
    for (const el of existing) {
      if (el.dataset.value === value.trim()) return;
    }
    const el = document.createElement('span');
    el.className = 'tag selected';
    el.textContent = value.trim();
    el.dataset.value = value.trim();
    el.addEventListener('click', () => {
      if (multiSelect) {
        el.classList.toggle('selected');
      } else {
        container.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
        el.classList.add('selected');
      }
    });
    container.appendChild(el);
  }

  // ─── Dynamic Lists ───
  function renderDynamicList(listId, items, typeField = false) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    if (!items || items.length === 0) return;
    items.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'dynamic-item';
      if (typeField) {
        const typeSpan = document.createElement('span');
        typeSpan.className = 'item-type';
        typeSpan.textContent = item.type || 'item';
        div.appendChild(typeSpan);
      }
      const textSpan = document.createElement('span');
      textSpan.className = 'item-text';
      const isSkillList = (listId === 'skills-list');
      if (isSkillList && item.name && item.description) {
        textSpan.innerHTML = `<strong>${escapeHTML(item.name)}</strong> — <span style="color:var(--text-secondary)">${escapeHTML(item.description)}</span> — <span style="color:var(--accent-gold);font-size:0.75rem;">${escapeHTML(item.level || 'Mới Học')}</span>`;
      } else if (typeField && item.type === 'character') {
        textSpan.innerHTML = `<span class="entity-inline-label">Tên:</span> ${escapeHTML(item.name)}`
          + (item.gender ? ` <span class="entity-inline-label">Giới Tính:</span> ${escapeHTML(item.gender)}` : '')
          + (item.personality ? ` <span class="entity-inline-label">Tính Cách:</span> ${escapeHTML(item.personality)}` : '')
          + ((item.description || item.backstory) ? ` <span class="entity-inline-label">Tiểu Sử:</span> ${escapeHTML(item.description || item.backstory || '')}` : '');
      } else if (typeField && item.type === 'location') {
        textSpan.innerHTML = `<span class="entity-inline-label">Địa Điểm:</span> ${escapeHTML(item.name)}` + (item.description ? ` — ${escapeHTML(item.description)}` : '');
      } else {
        textSpan.textContent = typeof item === 'string' ? item : `${item.name}${item.description ? ' - ' + item.description : ''}`;
      }
      div.appendChild(textSpan);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove-item';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => {
        items.splice(index, 1);
        renderDynamicList(listId, items, typeField);
      });
      div.appendChild(removeBtn);
      list.appendChild(div);
    });
  }

  // ─── Reset Form ───
  function resetNewGameForm() {
    initTagContainer('tag-genre', GENRE_TAGS, true);
    initTagContainer('tag-style', STYLE_TAGS, false);
    initTagContainer('tag-gender', GENDER_TAGS, false);
    initTagContainer('tag-personality', PERSONALITY_TAGS, true);

    document.getElementById('world-setting').value = '';
    document.getElementById('slider-difficulty').value = 3;
    document.getElementById('difficulty-label').textContent = '3 - Normal';
    document.getElementById('toggle-fanfiction').checked = false;
    document.getElementById('toggle-nsfw').checked = false;
    document.getElementById('fanfiction-source-group').style.display = 'none';
    document.getElementById('input-fanfiction-source').value = '';
    document.getElementById('magic-summary').value = '';
    document.getElementById('word-count-preset').value = '';
    document.getElementById('char-name').value = '';
    document.getElementById('char-backstory').value = '';

    window._rules = [];
    window._entities = [];
    window._skills = [];
    renderDynamicList('rules-list', window._rules);
    renderDynamicList('entities-list', window._entities, true);
    renderDynamicList('skills-list', window._skills);
  }

  // ─── Collect Form Data ───
  function collectWorldSettings() {
    const wcValue = document.getElementById('word-count-preset').value;
    let wordCount = null;
    switch (wcValue) {
      case '400-600': wordCount = { min: 400, max: 600 }; break;
      case '600-900': wordCount = { min: 600, max: 900 }; break;
      case '1000-1500': wordCount = { min: 1000, max: 1500 }; break;
    }
    return {
      genre: getSelectedTags('tag-genre'),
      setting: document.getElementById('world-setting').value,
      style: getSelectedTags('tag-style')[0] || '',
      difficulty: parseInt(document.getElementById('slider-difficulty').value),
      fanfiction: document.getElementById('toggle-fanfiction').checked,
      fanfictionSource: document.getElementById('input-fanfiction-source').value,
      nsfw: document.getElementById('toggle-nsfw').checked,
      rules: [...(window._rules || [])],
      entities: [...(window._entities || [])],
      wordCount,
    };
  }

  function collectCharacterData() {
    return {
      name: document.getElementById('char-name').value,
      gender: getSelectedTags('tag-gender')[0] || '',
      personality: getSelectedTags('tag-personality'),
      backstory: document.getElementById('char-backstory').value,
      skills: [...(window._skills || [])],
    };
  }

  function wordCountToTokens(wordCount) {
    if (!wordCount) return 4096;
    return Math.min(wordCount.max * 4 + 300, 8000);
  }

  function validateBeforeStart() {
    const world = collectWorldSettings();
    const character = collectCharacterData();
    if (!character.name || !character.name.trim()) {
      showToast('Vui lòng nhập tên nhân vật', 'warning');
      return false;
    }
    if (world.genre.length === 0) {
      showToast('Vui lòng chọn ít nhất một thể loại', 'warning');
      return false;
    }
    if (!world.setting.trim()) {
      showToast('Vui lòng mô tả bối cảnh thế giới', 'warning');
      return false;
    }
    if (!world.wordCount || !world.wordCount.min || !world.wordCount.max) {
      showToast('Vui lòng chọn Giới Hạn Số Từ cho AI', 'warning');
      return false;
    }
    return true;
  }

  function populateFormFromData(data) {
    resetNewGameForm();
    if (data.genre) {
      initTagContainer('tag-genre', GENRE_TAGS, true);
      data.genre.forEach(g => addTagToContainer('tag-genre', g, true));
    }
    if (data.setting) document.getElementById('world-setting').value = data.setting;
    if (data.style) {
      initTagContainer('tag-style', STYLE_TAGS, false);
      addTagToContainer('tag-style', data.style, false);
    }
    document.getElementById('slider-difficulty').value = data.difficulty || 3;
    document.getElementById('difficulty-label').textContent = `${data.difficulty || 3} - ${DIFFICULTY_LABELS[data.difficulty || 3]}`;
    document.getElementById('toggle-fanfiction').checked = data.fanfiction || false;
    document.getElementById('toggle-nsfw').checked = data.nsfw || false;
    if (data.fanfictionSource) {
      document.getElementById('fanfiction-source-group').style.display = 'block';
      document.getElementById('input-fanfiction-source').value = data.fanfictionSource;
    }
    window._rules = data.rules || [];
    renderDynamicList('rules-list', window._rules);
    window._entities = data.entities || [];
    renderDynamicList('entities-list', window._entities, true);
    if (data.character) {
      document.getElementById('char-name').value = data.character.name || '';
      if (data.character.gender) {
        initTagContainer('tag-gender', GENDER_TAGS, false);
        addTagToContainer('tag-gender', data.character.gender, false);
      }
      if (data.character.personality) {
        initTagContainer('tag-personality', PERSONALITY_TAGS, true);
        data.character.personality.forEach(p => addTagToContainer('tag-personality', p, true));
      }
      document.getElementById('char-backstory').value = data.character.backstory || '';
      window._skills = data.character.skills || [];
      renderDynamicList('skills-list', window._skills);
    }
    // Word count is NOT auto-populated from config — user must choose
  }

  // ═══════════════════════════════════════════════════════════
  // NEW GAME SCREEN INIT
  // ═══════════════════════════════════════════════════════════

  function initNewGame() {
    initTagContainer('tag-genre', GENRE_TAGS, true);
    initTagContainer('tag-style', STYLE_TAGS, false);
    initTagContainer('tag-gender', GENDER_TAGS, false);
    initTagContainer('tag-personality', PERSONALITY_TAGS, true);
    window._rules = [];
    window._entities = [];
    window._skills = [];
    renderDynamicList('rules-list', window._rules);
    renderDynamicList('entities-list', window._entities, true);
    renderDynamicList('skills-list', window._skills);

    document.getElementById('slider-difficulty').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      document.getElementById('difficulty-label').textContent = `${val} - ${DIFFICULTY_LABELS[val]}`;
    });
    document.getElementById('toggle-fanfiction').addEventListener('change', (e) => {
      document.getElementById('fanfiction-source-group').style.display = e.target.checked ? 'block' : 'none';
    });
    document.getElementById('btn-add-genre').addEventListener('click', () => {
      const input = document.getElementById('input-genre-custom');
      addTagToContainer('tag-genre', input.value, true);
      input.value = '';
    });
    document.getElementById('btn-add-style').addEventListener('click', () => {
      const input = document.getElementById('input-style-custom');
      addTagToContainer('tag-style', input.value, false);
      input.value = '';
    });
    document.getElementById('btn-add-personality').addEventListener('click', () => {
      const input = document.getElementById('input-personality-custom');
      addTagToContainer('tag-personality', input.value, true);
      input.value = '';
    });
    document.getElementById('btn-add-rule').addEventListener('click', () => {
      const input = document.getElementById('input-rule');
      if (input.value.trim()) {
        window._rules.push(input.value.trim());
        renderDynamicList('rules-list', window._rules);
        input.value = '';
      }
    });
    document.getElementById('btn-add-entity').addEventListener('click', () => {
      const type = document.getElementById('entity-type').value;
      const name = document.getElementById('entity-name').value.trim();
      if (name) {
        if (type === 'character') {
          const gender = document.getElementById('entity-gender').value.trim();
          const personality = document.getElementById('entity-personality').value.trim();
          const backstory = document.getElementById('entity-backstory').value.trim();
          window._entities.push({ type, name, gender, personality, backstory, description: backstory });
          document.getElementById('entity-gender').value = '';
          document.getElementById('entity-personality').value = '';
          document.getElementById('entity-backstory').value = '';
        } else {
          const desc = document.getElementById('entity-backstory').value.trim();
          window._entities.push({ type, name, description: desc || '' });
          document.getElementById('entity-backstory').value = '';
        }
        renderDynamicList('entities-list', window._entities, true);
        document.getElementById('entity-name').value = '';
      }
    });
    document.getElementById('btn-add-skill').addEventListener('click', () => {
      const name = document.getElementById('input-skill-name').value.trim();
      const desc = document.getElementById('input-skill-desc').value.trim();
      const level = document.getElementById('input-skill-level').value.trim();
      if (name) {
        window._skills.push({ name, description: desc, level: level || 'Mới Học' });
        renderDynamicList('skills-list', window._skills);
        document.getElementById('input-skill-name').value = '';
        document.getElementById('input-skill-desc').value = '';
        document.getElementById('input-skill-level').value = '';
      }
    });

    // Magic Button
    document.getElementById('btn-magic').addEventListener('click', async () => {
      const summary = document.getElementById('magic-summary').value.trim();
      if (!summary) {
        showToast('Vui lòng mô tả ý tưởng cốt truyện trước!', 'warning');
        return;
      }
      const btn = document.getElementById('btn-magic');
      btn.disabled = true;
      btn.textContent = '🔮 AI đang suy nghĩ...';
      try {
        const data = await window.novelAI.autoFillWorld(summary);
        populateFormFromData(data);
        showToast('✨ AI đã tự động điền form!', 'success');
      } catch (e) {
        showToast(`Ma Thuật thất bại: ${e.message}`, 'error');
        await window.gameStorage.logError(`Lỗi Ma Thuật: ${e.message}`);
      } finally {
        btn.disabled = false;
        btn.textContent = '🔮 MA THUẬT (AI Tự Động Điền)';
      }
    });

    // Config Save/Load (web: download/upload JSON file)
    document.getElementById('btn-save-world-config').addEventListener('click', async () => {
      const world = collectWorldSettings();
      const character = collectCharacterData();
      const data = { world, character };
      const result = await window.gameStorage.saveWorldConfig(data);
      if (result && result.success) {
        showToast('✅ Đã tải xuống file world-config.json!', 'success');
      } else {
        showToast('❌ Lưu Config thất bại', 'error');
      }
    });

    document.getElementById('btn-load-world-config').addEventListener('click', async () => {
      const data = await window.gameStorage.loadWorldConfig();
      if (data) {
        populateFormFromData({ ...(data.world || {}), character: data.character || {} });
        showToast('✅ Đã tải Config từ file!', 'success');
      }
    });

    document.getElementById('btn-reset-form').addEventListener('click', async () => {
      if (await showConfirm('Xóa toàn bộ dữ liệu form?')) {
        resetNewGameForm();
      }
    });

    // Start Adventure
    document.getElementById('btn-start-adventure').addEventListener('click', async () => {
      if (!validateBeforeStart()) return;
      const world = collectWorldSettings();
      const character = collectCharacterData();
      state.gameWorld = world;
      state.gameCharacter = character;
      state.storyHistory = [];
      state.storyHTML = [];
      state.journal = [];
      state.turnCount = 0;
      state.hasUnsavedChanges = false;
      showScreen('game');
      initGameScreen();
      await generateOpeningScene();
    });

    document.getElementById('btn-back-newgame').addEventListener('click', async () => {
      if (await showConfirm('Quay lại menu chính? Form chưa lưu sẽ bị mất.')) {
        showScreen('main-menu');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // LOAD GAME SCREEN
  // ═══════════════════════════════════════════════════════════

  async function loadSaveSlots() {
    const container = document.getElementById('slots-container');
    const result = await window.gameStorage.listSlots();
    if (!result.success || result.slots.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Không tìm thấy slot lưu nào</p>';
      return;
    }
    container.innerHTML = '';
    result.slots.forEach(slot => {
      const div = document.createElement('div');
      div.className = 'slot-item';
      const info = document.createElement('div');
      info.className = 'slot-info';
      info.innerHTML = `<span class="slot-name">${slot.name}</span><br><span class="slot-date">${slot.modified ? new Date(slot.modified).toLocaleString() : ''}</span>`;
      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn-small btn-purple';
      loadBtn.textContent = 'Tải';
      loadBtn.addEventListener('click', () => loadGameFromSlot(slot.name));
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-small btn-danger';
      delBtn.textContent = 'Xóa';
      delBtn.style.cssText = 'margin-left:4px;';
      delBtn.addEventListener('click', async () => {
        if (await showConfirm(`Xóa bản lưu "${slot.name}"?`)) {
          await window.gameStorage.deleteSlot(slot.name);
          loadSaveSlots();
        }
      });
      div.appendChild(info);
      div.appendChild(loadBtn);
      div.appendChild(delBtn);
      container.appendChild(div);
    });
  }

  async function loadGameFromSlot(slotName) {
    try {
      const data = await window.gameStorage.loadFromSlot(slotName);
      if (data) {
        restoreGameState(data);
        showScreen('game');
        initGameScreen();
        renderStoryFromHistory();
        updateAllMenuPanels();
        showToast(`Đã tải ván "${slotName}"!`, 'success');
      }
    } catch (e) {
      showToast(`Tải thất bại: ${e.message}`, 'error');
    }
  }

  function initLoadGame() {
    document.getElementById('btn-load-from-slot').addEventListener('click', () => {
      document.getElementById('save-slots-list').style.display = 'block';
      loadSaveSlots();
    });
    document.getElementById('btn-load-from-file').addEventListener('click', async () => {
      const data = await window.gameStorage.importFromFile();
      if (data) {
        restoreGameState(data);
        showScreen('game');
        initGameScreen();
        renderStoryFromHistory();
        updateAllMenuPanels();
        showToast('Đã tải ván chơi từ file!', 'success');
      }
    });
    document.getElementById('btn-refresh-slots').addEventListener('click', loadSaveSlots);
    document.getElementById('btn-back-from-load').addEventListener('click', () => showScreen('main-menu'));
  }

  function restoreGameState(data) {
    state.gameWorld = data.world;
    state.gameCharacter = data.character;
    state.storyTitle = data.storyTitle || '';
    state.storyHistory = data.storyHistory || [];
    state.storyHTML = data.storyHTML || [];
    state.journal = data.journal || [];
    state.turnCount = data.turnCount || 0;
    state.hasUnsavedChanges = false;
  }

  function getGameState() {
    return {
      world: state.gameWorld,
      character: state.gameCharacter,
      storyTitle: state.storyTitle,
      storyHistory: state.storyHistory,
      storyHTML: state.storyHTML,
      journal: state.journal,
      turnCount: state.turnCount,
      _savedAt: new Date().toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GAME SCREEN
  // ═══════════════════════════════════════════════════════════

  function initGameScreen() {
    document.getElementById('btn-exit-game').onclick = confirmExitGame;
    document.getElementById('btn-save-slot').onclick = () => {
      document.getElementById('save-dialog-overlay').style.display = 'flex';
      document.getElementById('save-slot-name').focus();
    };
    document.getElementById('btn-export-json').onclick = async () => {
      const stateData = getGameState();
      const result = await window.gameStorage.exportToFile(stateData, 'novel-save.json');
      if (result && result.success) {
        showToast('Đã tải xuống file JSON!', 'success');
        state.hasUnsavedChanges = false;
      }
    };

    // Save Dialog
    document.getElementById('btn-confirm-save').onclick = async () => {
      const name = document.getElementById('save-slot-name').value.trim();
      if (!name) {
        showToast('Vui lòng nhập tên bản lưu', 'warning');
        return;
      }
      const result = await window.gameStorage.saveToSlot(name, getGameState());
      if (result && result.success) {
        showToast(`Đã lưu với tên "${name}"!`, 'success');
        state.hasUnsavedChanges = false;
        document.getElementById('save-dialog-overlay').style.display = 'none';
        document.getElementById('save-slot-name').value = '';
      } else {
        showToast('Lưu thất bại', 'error');
      }
    };
    document.getElementById('btn-cancel-save').onclick = () => {
      document.getElementById('save-dialog-overlay').style.display = 'none';
      document.getElementById('save-slot-name').value = '';
    };

    // Menu Tabs — click to open/close panel for that tab
    document.querySelectorAll('.menu-tab').forEach(tab => {
      tab.onclick = () => {
        const tabId = tab.dataset.tab;
        const content = document.getElementById(tabId);
        const panel = document.getElementById('menu-panel');
        const wasOpen = panel.classList.contains('open');

        // If same tab is already active and panel is open → close panel
        if (wasOpen && tab.classList.contains('active')) {
          panel.classList.remove('open');
          tab.classList.remove('active');
          content.classList.remove('active');
          state.menuOpen = false;
          return;
        }

        // Open panel, activate selected tab
        panel.classList.add('open');
        state.menuOpen = true;
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.menu-tab-content').forEach(c => c.classList.remove('active'));
        content.classList.add('active');
      };
    });

    // Story Export Button (web: download as .doc)
    document.getElementById('btn-export-story').onclick = async () => {
      const title = state.storyTitle || 'Truyen';
      const safeName = title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Truyen';
      let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>${escapeHTML(title)}</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.8; color: #333; max-width: 700px; margin: 40px auto; padding: 20px; }
  h1 { text-align: center; font-size: 22pt; color: #b8860b; margin-bottom: 10px; }
  .divider { width: 120px; height: 2px; background: #b8860b; margin: 20px auto 30px; }
  p { margin-bottom: 14px; text-indent: 1.5em; }
  .action-block { text-align: center; padding: 12px 20px; margin: 20px 0; background: #f3f0ff; border: 1px solid #d4c5f9; border-radius: 6px; font-weight: bold; color: #5b3cc4; }
</style></head><body>
<h1>${escapeHTML(title)}</h1>
<div class="divider"></div>`;
      state.storyHistory.forEach(msg => {
        if (msg.role === 'user') {
          htmlContent += `<div class="action-block">⚔️ ${escapeHTML(msg.content)}</div>\n`;
        } else {
          const paragraphs = msg.content.split(/\n\n+/);
          paragraphs.forEach(p => {
            if (p.trim()) htmlContent += `<p>${escapeHTML(p.trim())}</p>\n`;
          });
        }
      });
      htmlContent += '</body></html>';
      await window.gameStorage.exportStoryDoc(htmlContent, `${safeName}.doc`);
      showToast(`Đã tải xuống ${safeName}.doc!`, 'success');
    };

    // Scroll Navigation
    document.getElementById('btn-scroll-top').onclick = () => {
      document.getElementById('story-container').scrollTo({ top: 0, behavior: 'smooth' });
    };
    document.getElementById('btn-scroll-bottom').onclick = () => {
      const container = document.getElementById('story-container');
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    };

    // Search (Ctrl+F)
    document.addEventListener('keydown', handleGlobalKeydown);
    document.getElementById('search-input').addEventListener('input', () => {
      performSearch(document.getElementById('search-input').value);
    });
    document.getElementById('search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateSearchResults(1);
      }
    });
    document.getElementById('btn-search-prev').onclick = () => navigateSearchResults(-1);
    document.getElementById('btn-search-next').onclick = () => navigateSearchResults(1);
    document.getElementById('btn-search-close').onclick = closeSearch;

    // Action Bar
    document.getElementById('btn-action').onclick = () => handlePlayerAction();
    document.getElementById('btn-narrate').onclick = () => handleNarrate();
    document.getElementById('btn-suggest').onclick = () => handleSuggest();
    document.getElementById('action-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handlePlayerAction();
      }
    });

    // Close/Minimize Suggestions
    document.getElementById('btn-close-suggestions').onclick = () => {
      document.getElementById('suggestions-panel').style.display = 'none';
    };
    document.getElementById('btn-minimize-suggestions').onclick = () => {
      document.getElementById('suggestions-panel').style.display = 'none';
      document.getElementById('suggestions-minimized').style.display = 'block';
    };
    document.getElementById('btn-restore-suggestions').onclick = () => {
      document.getElementById('suggestions-minimized').style.display = 'none';
      document.getElementById('suggestions-panel').style.display = 'block';
    };

    updateAllMenuPanels();
    if (state.storyHTML.length > 0) {
      renderStoryFromHistory();
    }
  }

  // ─── Global Key Handler ───
  function handleGlobalKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      openSearch();
      return;
    }
    if (e.key === 'Escape') {
      if (document.getElementById('search-bar').style.display !== 'none') {
        closeSearch();
        return;
      }
      if (state.menuOpen) {
        document.getElementById('menu-panel').classList.remove('open');
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.menu-tab-content').forEach(c => c.classList.remove('active'));
        state.menuOpen = false;
        return;
      }
    }
  }

  // ─── Search ───
  function openSearch() {
    document.getElementById('search-bar').style.display = 'flex';
    document.getElementById('search-input').focus();
    document.getElementById('search-input').select();
  }

  function closeSearch() {
    document.getElementById('search-bar').style.display = 'none';
    document.getElementById('search-input').value = '';
    state.searchResults = [];
    state.searchIndex = 0;
    const storyEl = document.getElementById('story-text');
    storyEl.innerHTML = storyEl.innerHTML.replace(/<mark class="search-highlight">(.*?)<\/mark>/g, '$1');
    storyEl.innerHTML = storyEl.innerHTML.replace(/<mark class="search-current">(.*?)<\/mark>/g, '$1');
  }

  function performSearch(query) {
    const storyEl = document.getElementById('story-text');
    const rawText = storyEl.textContent;
    state.searchResults = [];
    state.searchIndex = 0;
    if (!query || query.length < 2) {
      document.getElementById('search-count').textContent = '0/0';
      return;
    }
    const regex = new RegExp(escapeRegex(query), 'gi');
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      state.searchResults.push(match.index);
    }
    document.getElementById('search-count').textContent =
      state.searchResults.length > 0 ? `1/${state.searchResults.length}` : '0/0';
    if (state.searchResults.length > 0) {
      state.searchIndex = 0;
      highlightAndScrollToResult(0);
    }
  }

  function navigateSearchResults(direction) {
    if (state.searchResults.length === 0) return;
    state.searchIndex += direction;
    if (state.searchIndex >= state.searchResults.length) state.searchIndex = 0;
    if (state.searchIndex < 0) state.searchIndex = state.searchResults.length - 1;
    document.getElementById('search-count').textContent =
      `${state.searchIndex + 1}/${state.searchResults.length}`;
    highlightAndScrollToResult(state.searchIndex);
  }

  function highlightAndScrollToResult(index) {
    const storyEl = document.getElementById('story-text');
    const query = document.getElementById('search-input').value;
    if (!query) return;
    const rawText = storyEl.textContent;
    const regex = new RegExp(escapeRegex(query), 'gi');
    let count = 0;
    const highlighted = rawText.replace(regex, (match) => {
      const cls = count === index ? 'search-highlight search-current' : 'search-highlight';
      count++;
      return `<mark class="${cls}">${match}</mark>`;
    });
    storyEl.innerHTML = highlighted;
    setTimeout(() => {
      const current = storyEl.querySelector('mark.search-current');
      if (current) {
        current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ─── Menu Panel ───
  function updateAllMenuPanels() {
    updateCharacterPanel();
    updateNPCsPanel();
    updateWorldInfoPanel();
    updateJournalPanel();
  }

  function updateCharacterPanel() {
    const c = state.gameCharacter;
    if (!c) return;
    const backstory = c.backstory || 'Quá khứ bí ẩn';
    document.getElementById('char-panel-bio').innerHTML = `
      <div class="menu-section-title">📖 Tiểu Sử</div>
      <div class="info-card"><span class="info-label">Tên</span><span class="info-value">${escapeHTML(c.name)}</span></div>
      <div class="info-card"><span class="info-label">Giới Tính</span><span class="info-value">${escapeHTML(c.gender || 'Chưa rõ')}</span></div>
      <div class="info-card"><span class="info-label">Tính Cách</span><span class="info-value">${escapeHTML((c.personality || []).join(', ') || 'Không có')}</span></div>
      <details class="info-detail">
        <summary class="info-detail-summary"><span class="info-label" style="margin-bottom:0;">Tiểu Sử</span></summary>
        <div class="info-detail-body">${escapeHTML(backstory)}</div>
      </details>
    `;

    const skills = state.gameCharacter?.skills || [];
    const skillsHTML = skills.length > 0
      ? skills.map(s => {
          if (typeof s === 'object' && s.name) {
            return `
            <details class="info-detail">
              <summary class="info-detail-summary skill-summary">
                <span class="skill-name">${escapeHTML(s.name)}</span>
                <span class="skill-level-tag">${escapeHTML(s.level || 'Mới Học')}</span>
              </summary>
              <div class="info-detail-body">${escapeHTML(s.description || '')}</div>
            </details>`;
          }
          return `<div class="info-card"><span class="info-value">${escapeHTML(s)}</span></div>`;
        }).join('')
      : '<p style="color:var(--text-muted)">Không có kỹ năng</p>';
    document.getElementById('char-panel-skills').innerHTML = `<div class="menu-section-title">⚔️ Kỹ Năng</div>${skillsHTML}`;

    const items = state.gameWorld?.entities?.filter(e => e.type === 'item') || [];
    const invHTML = items.length > 0
      ? items.map(i => `
        <details class="info-detail">
          <summary class="info-detail-summary">${escapeHTML(i.name)}</summary>
          <div class="info-detail-body">${escapeHTML(i.description || 'Không có mô tả')}</div>
        </details>
      `).join('')
      : '<p style="color:var(--text-muted)">Không có vật phẩm</p>';
    document.getElementById('char-panel-inventory').innerHTML = `<div class="menu-section-title">🎒 Giỏ Đồ</div>${invHTML}`;

    const statuses = state.characterStatuses || [];
    const statusHTML = statuses.length > 0
      ? statuses.map(s => {
        const isBuff = s.type === 'buff';
        const isDebuff = s.type === 'debuff';
        const statusColor = isBuff ? 'var(--success)' : (isDebuff ? 'var(--danger)' : 'var(--accent-cyan)');
        const statusBg = isBuff ? 'rgba(34,197,94,0.06)' : (isDebuff ? 'rgba(239,68,68,0.06)' : 'rgba(6,182,212,0.06)');
        const statusBorder = isBuff ? 'rgba(34,197,94,0.15)' : (isDebuff ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.1)');
        const statusIcon = isBuff ? '🟢' : (isDebuff ? '🔴' : '🔵');
        return `
        <details class="info-detail" style="border-color:${statusBorder};background:${statusBg};">
          <summary class="info-detail-summary">
            <span style="color:${statusColor};font-weight:600;">${statusIcon} ${escapeHTML(s.name)}</span>
          </summary>
          <div class="info-detail-body">${escapeHTML(s.description || 'Không có mô tả')}</div>
        </details>`;
      }).join('')
      : '<p style="color:var(--text-muted)">Không có trạng thái đặc biệt</p>';

    let statusDiv = document.getElementById('char-panel-status');
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = 'char-panel-status';
      const skillsEl = document.getElementById('char-panel-skills');
      skillsEl.parentNode.insertBefore(statusDiv, skillsEl.nextSibling);
    }
    statusDiv.innerHTML = `<div class="menu-section-title">📊 Trạng Thái</div>${statusHTML}`;
  }

  function updateNPCsPanel() {
    const entities = state.gameWorld?.entities || [];
    document.getElementById('npcs-content').innerHTML = entities.length > 0
      ? entities.map(e => {
        if (e.type === 'character') {
          const mainCharName = (state.gameCharacter?.name || '').toLowerCase().trim();
          const entityName = (e.name || '').toLowerCase().trim();
          if (mainCharName && entityName && mainCharName === entityName) return '';
          return `
            <details class="info-detail">
              <summary class="info-detail-summary"><span class="entity-type-tag">Nhân Vật</span> ${escapeHTML(e.name)}</summary>
              <div class="info-detail-body">
                ${e.gender ? `<div class="info-card"><span class="info-label">Giới Tính</span><span class="info-value">${escapeHTML(e.gender)}</span></div>` : ''}
                ${e.personality ? `<div class="info-card"><span class="info-label">Tính Cách</span><span class="info-value">${escapeHTML(e.personality)}</span></div>` : ''}
                ${(e.description || e.backstory) ? `<div class="info-card"><span class="info-label">Tiểu Sử</span><span class="info-value">${escapeHTML(e.description || e.backstory || '')}</span></div>` : ''}
              </div>
            </details>`;
        } else if (e.type === 'location') {
          return `
            <details class="info-detail">
              <summary class="info-detail-summary"><span class="entity-type-tag">Địa Điểm</span> ${escapeHTML(e.name)}</summary>
              <div class="info-detail-body">${escapeHTML(e.description || 'Không có mô tả')}</div>
            </details>`;
        }
        return `
          <details class="info-detail">
            <summary class="info-detail-summary"><span class="entity-type-tag">${escapeHTML(e.type)}</span> ${escapeHTML(e.name)}</summary>
            <div class="info-detail-body">${escapeHTML(e.description || 'Không có mô tả')}</div>
          </details>`;
      }).filter(Boolean).join('')
      : '<p style="color:var(--text-muted)">Không có thực thể</p>';
  }

  function updateWorldInfoPanel() {
    const w = state.gameWorld;
    if (!w) return;
    const rules = w.rules || [];
    const rulesHTML = rules.length > 0
      ? rules.map((r, i) => `<div class="info-rule-item">${i + 1}. ${escapeHTML(r)}</div>`).join('')
      : '<p style="color:var(--text-muted)">Không có luật lệ</p>';
    document.getElementById('world-info-content').innerHTML = `
      <div class="info-card"><span class="info-label">Thể Loại</span><span class="info-value">${escapeHTML((w.genre || []).join(', '))}</span></div>
      <div class="info-card"><span class="info-label">Văn Phong</span><span class="info-value">${escapeHTML(w.style || '')}</span></div>
      <div class="info-card"><span class="info-label">Độ Khó</span><span class="info-value">${w.difficulty || 3} - ${DIFFICULTY_LABELS[w.difficulty || 3]}</span></div>
      <details class="info-detail">
        <summary class="info-detail-summary"><span class="info-label" style="margin-bottom:0;">Bối Cảnh</span></summary>
        <div class="info-detail-body">${escapeHTML(w.setting || '')}</div>
      </details>
      <details class="info-detail">
        <summary class="info-detail-summary"><span class="info-label" style="margin-bottom:0;">Luật Lệ</span></summary>
        <div class="info-detail-body">${rulesHTML}</div>
      </details>
    `;
  }

  function updateJournalPanel() {
    document.getElementById('journal-content').innerHTML = state.journal.length > 0
      ? state.journal.map(j => `
        <div class="info-card">
          <span class="info-label">Lượt ${j.turn}</span>
          <span class="info-value">${escapeHTML(j.summary)}</span>
        </div>
      `).join('')
      : '<p style="color:var(--text-muted)">Nhật ký còn trống</p>';
  }

  // ═══════════════════════════════════════════════════════════
  // STORY GENERATION
  // ═══════════════════════════════════════════════════════════

  function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
  }

  async function generateOpeningScene() {
    showLoading(true);
    try {
      // First, generate a title
      const titlePrompt = window.novelAI._buildSystemPrompt(
        state.gameWorld, state.gameCharacter,
        DIFFICULTY_LABELS[state.gameWorld.difficulty],
        state.gameWorld.wordCount
      );
      const titleResponse = await window.novelAI.sendMessage(
        titlePrompt,
        [{ role: 'user', content: `Hãy tạo một tiêu đề truyện hấp dẫn, độc đáo bằng tiếng Việt cho câu chuyện này. Chỉ trả về tiêu đề, không thêm gì khác.` }],
        100
      );
      state.storyTitle = titleResponse.trim().replace(/^["']|["']$/g, '');

      // Generate opening scene
      const systemPrompt = window.novelAI._buildSystemPrompt(
        state.gameWorld, state.gameCharacter,
        DIFFICULTY_LABELS[state.gameWorld.difficulty],
        state.gameWorld.wordCount
      );
      const openingPrompt = `Hãy viết cảnh mở đầu cho câu chuyện "${state.storyTitle}". Đây là cảnh ĐẦU TIÊN. Giới thiệu nhân vật chính ${state.gameCharacter.name}, bối cảnh, và tạo một tình huống mở đầu hấp dẫn để người chơi bắt đầu tương tác. Viết bằng tiếng Việt, đúng số từ đã yêu cầu.`;
      
      const maxTokens = wordCountToTokens(state.gameWorld.wordCount);
      const storyContent = await window.novelAI.sendMessage(systemPrompt, [{ role: 'user', content: openingPrompt }], maxTokens);

      state.storyHistory.push({ role: 'assistant', content: storyContent });
      state.storyHTML.push({ type: 'title', content: state.storyTitle });
      state.storyHTML.push({ type: 'story', content: storyContent });
      state.turnCount = 1;
      state.hasUnsavedChanges = true;

      renderStoryFromHistory();
      addJournalEntry(storyContent);
      updateAllMenuPanels();
    } catch (e) {
      showToast(`Lỗi tạo câu chuyện: ${e.message}`, 'error');
      await window.gameStorage.logError(`Lỗi mở đầu: ${e.message}`);
    } finally {
      showLoading(false);
    }
  }

  async function handlePlayerAction() {
    const input = document.getElementById('action-input');
    const action = input.value.trim();
    if (!action) return;

    input.value = '';
    state.storyHistory.push({ role: 'user', content: action });
    appendStoryText(action, true);
    state.hasUnsavedChanges = true;

    showLoading(true);
    try {
      const systemPrompt = window.novelAI._buildSystemPrompt(
        state.gameWorld, state.gameCharacter,
        DIFFICULTY_LABELS[state.gameWorld.difficulty],
        state.gameWorld.wordCount
      );
      const maxTokens = wordCountToTokens(state.gameWorld.wordCount);
      const storyContent = await window.novelAI.sendMessage(systemPrompt, state.storyHistory.slice(-10), maxTokens);

      state.storyHistory.push({ role: 'assistant', content: storyContent });
      state.storyHTML.push({ type: 'story', content: storyContent });
      state.turnCount++;

      appendStoryText(storyContent, false);
      addJournalEntry(storyContent);
      updateCharacterStatuses(storyContent);
      updateAllMenuPanels();
    } catch (e) {
      showToast(`Lỗi: ${e.message}`, 'error');
      await window.gameStorage.logError(`Lỗi hành động: ${e.message}`);
    } finally {
      showLoading(false);
    }
  }

  async function handleNarrate() {
    showLoading(true);
    try {
      const systemPrompt = window.novelAI._buildSystemPrompt(
        state.gameWorld, state.gameCharacter,
        DIFFICULTY_LABELS[state.gameWorld.difficulty],
        state.gameWorld.wordCount
      );
      const narratePrompt = { role: 'user', content: '(Người chơi chọn tiếp tục theo dõi câu chuyện. Hãy viết tiếp diễn biến tiếp theo một cách tự nhiên và hấp dẫn. Đừng hỏi người chơi phải làm gì.)' };
      
      const maxTokens = wordCountToTokens(state.gameWorld.wordCount);
      const storyContent = await window.novelAI.sendMessage(systemPrompt, [...state.storyHistory.slice(-9), narratePrompt], maxTokens);

      state.storyHistory.push({ role: 'assistant', content: storyContent });
      state.storyHTML.push({ type: 'story', content: storyContent });
      state.turnCount++;
      state.hasUnsavedChanges = true;

      appendStoryText(storyContent, false);
      addJournalEntry(storyContent);
      updateCharacterStatuses(storyContent);
      updateAllMenuPanels();
    } catch (e) {
      showToast(`Lỗi: ${e.message}`, 'error');
      await window.gameStorage.logError(`Lỗi tường thuật: ${e.message}`);
    } finally {
      showLoading(false);
    }
  }

  async function handleSuggest() {
    showLoading(true);
    try {
      const systemPrompt = window.novelAI._buildSystemPrompt(
        state.gameWorld, state.gameCharacter,
        DIFFICULTY_LABELS[state.gameWorld.difficulty],
        state.gameWorld.wordCount
      );
      const lastChunk = state.storyHistory.length > 0
        ? state.storyHistory[state.storyHistory.length - 1].content
        : 'The story is just beginning.';

      const data = await window.novelAI.generateSuggestions(systemPrompt, state.storyHistory, lastChunk);
      renderSuggestions(data.suggestions || []);
      document.getElementById('suggestions-panel').style.display = 'block';
      document.getElementById('suggestions-minimized').style.display = 'none';
    } catch (e) {
      showToast(`Gợi ý thất bại: ${e.message}`, 'error');
      await window.gameStorage.logError(`Lỗi gợi ý: ${e.message}`);
    } finally {
      showLoading(false);
    }
  }

  function renderSuggestions(suggestions) {
    const grid = document.getElementById('suggestions-grid');
    grid.innerHTML = '';
    suggestions.forEach(s => {
      const rate = s.successRate || 50;
      let rateClass = 'medium';
      if (rate >= 70) rateClass = 'high';
      if (rate <= 30) rateClass = 'low';
      const card = document.createElement('div');
      card.className = 'suggestion-card';
      card.innerHTML = `
        <div class="card-action">${escapeHTML(s.action)}</div>
        <div class="card-rate ${rateClass}">🎯 Tỷ Lệ Thành Công: ${rate}%</div>
        <div class="card-detail">❌ Thất Bại: ${escapeHTML(s.failureConsequence || 'Không rõ')}</div>
        <div class="card-detail">✅ Thành Công: ${escapeHTML(s.successReward || 'Không rõ')}</div>
      `;
      card.addEventListener('click', () => {
        const formatted = `${s.action} (Tỷ lệ thành công: ${rate}%, Thất Bại: "${s.failureConsequence || 'Không rõ'}", Thành Công: "${s.successReward || 'Không rõ'}")`;
        document.getElementById('action-input').value = formatted;
        document.getElementById('suggestions-panel').style.display = 'none';
        document.getElementById('action-input').focus();
      });
      grid.appendChild(card);
    });
  }

  async function addJournalEntry(storyChunk) {
    try {
      const summary = await window.novelAI.generateJournalSummary(storyChunk);
      state.journal.push({ turn: state.turnCount, summary });
      updateJournalPanel();
    } catch {
      // Journal is optional
    }
  }

  async function updateCharacterStatuses(storyChunk) {
    try {
      const systemPrompt = window.novelAI._buildSystemPrompt(
        state.gameWorld, state.gameCharacter,
        DIFFICULTY_LABELS[state.gameWorld.difficulty],
        state.gameWorld.wordCount
      );
      const currentStatuses = JSON.stringify(state.characterStatuses || []);
      const currentSkills = JSON.stringify(state.gameCharacter?.skills || []);
      const prompt = `Dựa vào đoạn truyện vừa viết, hãy phân tích và cập nhật trạng thái + kỹ năng của nhân vật chính ${state.gameCharacter.name}.

TRẠNG THÁI HIỆN TẠI: ${currentStatuses}
KỸ NĂNG HIỆN TẠI: ${currentSkills}

Trả về CHỈ JSON hợp lệ với format:
{
  "statuses": [
    {"name": "Tên trạng thái", "description": "Mô tả", "type": "buff/neutral/debuff"}
  ],
  "skills": [
    {"name": "Tên kỹ năng", "description": "Mô tả", "level": "Mới Học/Làm Quen/Thành Thạo/Tinh Thông/Bậc Thầy"}
  ]
}

QUY TẮC:
- statuses: Chỉ liệt kê TRẠNG THÁI HIỆN TẠI sau diễn biến mới.
  + type="buff" nếu là hiệu ứng tích cực
  + type="debuff" nếu là hiệu ứng tiêu cực
  + type="neutral" nếu là trạng thái trung tính
- skills: Liệt kê TOÀN BỘ kỹ năng hiện có + kỹ năng mới nếu được học.
- Tất cả nội dung bằng tiếng Việt.

ĐOẠN TRUYỆN MỚI: "${storyChunk.slice(-1500)}"`;

      const response = await window.novelAI.sendMessage(
        'Bạn là trợ lý theo dõi nhân vật. Chỉ trả về JSON hợp lệ.',
        [{ role: 'user', content: prompt }],
        500
      );

      try {
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        const data = JSON.parse(cleaned.trim());
        if (data.statuses && Array.isArray(data.statuses)) {
          state.characterStatuses = data.statuses;
        }
        if (data.skills && Array.isArray(data.skills)) {
          state.gameCharacter.skills = data.skills;
        }
      } catch {
        // Keep old data
      }
      updateCharacterPanel();
    } catch {
      // Status update is optional
    }
  }

  function appendStoryText(text, isAction) {
    const storyEl = document.getElementById('story-text');
    const placeholder = storyEl.querySelector('.story-placeholder');
    if (placeholder) placeholder.remove();

    if (isAction) {
      const block = document.createElement('span');
      block.className = 'player-action-block';
      block.textContent = `⚔️ ${text}`;
      storyEl.appendChild(block);
    } else {
      const paragraphs = text.split(/\n\n+/);
      paragraphs.forEach(p => {
        if (p.trim()) {
          const para = document.createElement('p');
          para.textContent = p.trim();
          storyEl.appendChild(para);
        }
      });
    }
  }

  function renderStoryFromHistory() {
    const storyEl = document.getElementById('story-text');
    storyEl.innerHTML = '';

    if (state.storyTitle) {
      const titleBlock = document.createElement('div');
      titleBlock.className = 'story-title-block';
      titleBlock.innerHTML = `<h1 class="story-title">${escapeHTML(state.storyTitle)}</h1><div class="story-title-divider"></div>`;
      storyEl.appendChild(titleBlock);
    }

    state.storyHistory.forEach(msg => {
      if (msg.role === 'user') {
        const block = document.createElement('span');
        block.className = 'player-action-block';
        block.textContent = `⚔️ ${msg.content}`;
        storyEl.appendChild(block);
      } else {
        const paragraphs = msg.content.split(/\n\n+/);
        paragraphs.forEach(p => {
          if (p.trim()) {
            const para = document.createElement('p');
            para.textContent = p.trim();
            storyEl.appendChild(para);
          }
        });
      }
    });

    if (storyEl.children.length === 0) {
      const p = document.createElement('p');
      p.className = 'story-placeholder';
      p.textContent = 'Cuộc phiêu lưu của bạn sẽ hiển thị ở đây...';
      storyEl.appendChild(p);
    }
  }

  async function confirmExitGame() {
    if (state.hasUnsavedChanges) {
      const saveFirst = await showConfirm('Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi thoát không?', 'Chưa Lưu');
      if (saveFirst) {
        document.getElementById('save-dialog-overlay').style.display = 'flex';
        document.getElementById('save-slot-name').focus();
        return;
      }
    }
    if (await showConfirm('Thoát về menu chính? Dữ liệu phiên sẽ được giữ trong bộ nhớ cho đến khi bạn tải lại trang.')) {
      state.hasUnsavedChanges = false;
      showScreen('main-menu');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function injectSearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      mark.search-highlight { background: rgba(255,184,0,0.3); color: #fff; border-radius: 2px; }
      mark.search-current { background: rgba(255,184,0,0.7); color: #000; border-radius: 2px; }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  function init() {
    // ── Theme Toggle Buttons ──
    function toggleThemeUI() {
      document.body.classList.toggle('theme-warm');
      const isWarm = document.body.classList.contains('theme-warm');
      const icon = isWarm ? '☀️' : '🌓';
      localStorage.setItem('dsng_theme', isWarm ? 'warm' : 'dark');
      // Update all theme toggle buttons
      const btns = document.querySelectorAll('#btn-theme-toggle, #btn-game-theme-toggle');
      btns.forEach(b => b.textContent = icon);
    }
    const btns = document.querySelectorAll('#btn-theme-toggle, #btn-game-theme-toggle');
    btns.forEach(b => b.addEventListener('click', toggleThemeUI));
    // Restore saved theme
    if (localStorage.getItem('dsng_theme') === 'warm') {
      document.body.classList.add('theme-warm');
      btns.forEach(b => b.textContent = '☀️');
    }

    try {
      injectSearchStyles();
      initMainMenu();
      initApiSettings();
      initNewGame();
      initLoadGame();

      const config = window.gameStorage.loadApiConfig();
      if (config) {
        window.novelAI.setConfig(config.provider, config.apiKeys);
      }

      showScreen('main-menu');
      console.log('DeepSeek Novel Game (Web) initialized');
    } catch (e) {
      console.error('INIT ERROR:', e.message, e.stack);
      if (window.gameStorage) {
        window.gameStorage.logError('INIT FAILED: ' + e.message + '\n' + (e.stack || ''));
      }
      try { showScreen('main-menu'); } catch (_) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
