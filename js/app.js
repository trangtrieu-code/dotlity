(function () {
  // Constants
  const STORAGE_THEME = 'dotlity-theme';
  const STORAGE_USER_NAME = 'dotlity-userName';
  const STORAGE_BG_IMAGE = 'dotlity-bgImage';
  const STORAGE_CUSTOM_BG = 'dotlity-customBg';
  const PICSUM_BASE = 'https://picsum.photos';

  // DOM refs
  const settingsBtn = document.getElementById('appSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsClose = document.getElementById('settingsClose');
  const settingsSave = document.getElementById('settingsSave');
  const settingsUserName = document.getElementById('settingsUserName');
  const settingsCustomBg = document.getElementById('settingsCustomBg');
  const settingsNewBgBtn = document.getElementById('settingsNewBgBtn');
  const settingsBackdrop = settingsModal ? settingsModal.querySelector('.settings-backdrop') : null;

  // Theme: apply saved preference on load (skip if custom background is used later)
  const html = document.documentElement;
  const savedTheme = localStorage.getItem(STORAGE_THEME);
  if (savedTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  // Theme toggle: click to switch light/dark and persist
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      html.classList.toggle('dark');
      const isDark = html.classList.contains('dark');
      localStorage.setItem(STORAGE_THEME, isDark ? 'dark' : 'light');
    });
  }

  // Helper: turn "notes" into "widgetNotes" so we can find the panel in the HTML
  function getWidgetId(widgetName) {
    const firstLetter = widgetName.charAt(0).toUpperCase();
    const rest = widgetName.slice(1);
    return 'widget' + firstLetter + rest;
  }

  // Helper: set nav button active if its panel is visible, inactive if hidden
  function setNavActive(widgetName) {
    const panelId = getWidgetId(widgetName);
    const panel = document.getElementById(panelId);
    const navBtn = document.querySelector('.nav-widget[data-widget="' + widgetName + '"]');
    if (!navBtn || !panel) return;
    if (panel.classList.contains('hidden')) {
      navBtn.classList.remove('active');
    } else {
      navBtn.classList.add('active');
    }
  }

  // Nav bar: when you click a widget button, show or hide that panel
  const navButtons = document.querySelectorAll('.nav-widget');
  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const widgetName = this.getAttribute('data-widget');  // e.g. "notes", "todo"
      const panelId = getWidgetId(widgetName);             // e.g. "widgetNotes"
      const panel = document.getElementById(panelId);      // find the panel in the HTML
      if (panel) {
        panel.classList.toggle('hidden');  // if it was hidden, show it; if visible, hide it
        setNavActive(widgetName);  // update nav so it shows which widgets are open
      }
    });
  });

  // Close button on each widget: hide that panel
  const closeButtons = document.querySelectorAll('.widget-close');
  closeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const widgetName = this.getAttribute('data-widget');
      const panelId = getWidgetId(widgetName);
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('hidden');
        setNavActive(widgetName);  // remove active state from nav button
      }
    });
  });

  // Dragging: drag a widget by its header to move it
  const main = document.querySelector('main');
  if (main) {
    const headers = document.querySelectorAll('.widget-header');
    headers.forEach(function (header) {
      header.addEventListener('mousedown', function (e) {
        const panel = this.closest('.widget-window');
        if (!panel) return;

        // Where the main area is on the page (widgets are positioned inside main)
        const mainRect = main.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();

        // Panel position relative to main when we started (in pixels)
        const startElLeft = panelRect.left - mainRect.left;
        const startElTop = panelRect.top - mainRect.top;

        // Mouse position when we started dragging
        const startX = e.clientX;
        const startY = e.clientY;

        // Use pixel position so we can update it while dragging.
        // Clear right/bottom so widgets that use bottom/right (e.g. Todo, Ambient) don't stretch in height.
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.left = startElLeft + 'px';
        panel.style.top = startElTop + 'px';

        function onMouseMove(moveEvent) {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          panel.style.left = (startElLeft + dx) + 'px';
          panel.style.top = (startElTop + dy) + 'px';
        }

        function onMouseUp() {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }


  // Settings modal: save, restore, and apply custom background
  var settingsSnapshot = { customBg: false, bgImage: null, name: '' };
  var draftCustomBg = false;
  var draftBgImage = null;

  // Helper: apply custom background to body
  function applyToBodyOnly(url) {
    var body = document.body;
    if (!url) {
      body.classList.remove('custom-bg');
      body.style.backgroundImage = '';
      return;
    }
    body.classList.add('custom-bg');
    body.style.backgroundImage = 'url("' + url + '")';
  }

  // Helper: restore custom background from snapshot
  function restoreSnapshot() {
    if (settingsSnapshot.customBg && settingsSnapshot.bgImage) {
      applyToBodyOnly(settingsSnapshot.bgImage);
    } else {
      applyToBodyOnly(null);
    }
  }

  // Helper: set custom background from checkbox
  function setCustomBgFromCheckbox() {
    if (!settingsCustomBg) return;
    draftCustomBg = settingsCustomBg.checked;
    if (!draftCustomBg) {
      restoreSnapshot();
    }
  }

  // Helper: load new background
  function loadNewBackground() {
    if (!settingsNewBgBtn) return;
    settingsNewBgBtn.disabled = true;
    settingsNewBgBtn.textContent = 'Loading…';
    var img = new Image();
    var url = PICSUM_BASE + '/1920/1080?random=' + Date.now();
    img.onload = function () {
      draftBgImage = url;
      draftCustomBg = true;
      if (settingsCustomBg) settingsCustomBg.checked = true;
      applyToBodyOnly(url);
      settingsNewBgBtn.disabled = false;
      settingsNewBgBtn.innerHTML = '<span class="material-symbols-outlined text-lg">image</span> New background';
    };
    img.onerror = function () {
      settingsNewBgBtn.disabled = false;
      settingsNewBgBtn.innerHTML = '<span class="material-symbols-outlined text-lg">image</span> New background';
    };
    img.src = url;
  }

  // Helper: open settings modal
  function openSettings() {
    if (!settingsModal) return;
    try {
      settingsSnapshot.customBg = localStorage.getItem(STORAGE_CUSTOM_BG) === 'true';
      settingsSnapshot.bgImage = localStorage.getItem(STORAGE_BG_IMAGE) || null;
      settingsSnapshot.name = localStorage.getItem(STORAGE_USER_NAME) || '';
    } catch (e) {}
    draftCustomBg = settingsSnapshot.customBg;
    draftBgImage = settingsSnapshot.bgImage;
    if (settingsUserName) settingsUserName.value = settingsSnapshot.name;
    if (settingsCustomBg) settingsCustomBg.checked = draftCustomBg;
    settingsModal.classList.remove('hidden');
    settingsModal.setAttribute('aria-hidden', 'false');
  }

  // clise settings modal
  function closeSettings(restore) {
    if (!settingsModal) return;
    if (restore !== false) restoreSnapshot();
    settingsModal.classList.add('hidden');
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  // save settings
  function saveSettings() {
    var name = settingsUserName ? settingsUserName.value.trim() : '';
    try {
      if (name) localStorage.setItem(STORAGE_USER_NAME, name);
      else localStorage.removeItem(STORAGE_USER_NAME);
      localStorage.setItem(STORAGE_CUSTOM_BG, draftCustomBg ? 'true' : 'false');
      if (draftCustomBg && draftBgImage) localStorage.setItem(STORAGE_BG_IMAGE, draftBgImage);
      applyToBodyOnly(draftCustomBg ? draftBgImage : null);
    } catch (e) {}
    closeSettings(false);
    document.dispatchEvent(new CustomEvent('dotlity-settings-saved'));
  }

  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (settingsClose) settingsClose.addEventListener('click', function () { closeSettings(true); });
  if (settingsSave) settingsSave.addEventListener('click', saveSettings);
  if (settingsBackdrop) settingsBackdrop.addEventListener('click', function () { closeSettings(true); });
  if (settingsNewBgBtn) settingsNewBgBtn.addEventListener('click', loadNewBackground);
  if (settingsCustomBg) settingsCustomBg.addEventListener('change', setCustomBgFromCheckbox);

  // apply custom background from localStorage
  (function () {
    try {
      var useCustom = localStorage.getItem(STORAGE_CUSTOM_BG) === 'true';
      var saved = localStorage.getItem(STORAGE_BG_IMAGE);
      if (useCustom && saved) {
        document.body.classList.add('custom-bg');
        document.body.style.backgroundImage = 'url("' + saved + '")';
      }
    } catch (e) {}
  })();
})();
