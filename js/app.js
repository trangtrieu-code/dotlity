(function () {
  // Constants
  const STORAGE_THEME = 'dotlity-theme';
  const STORAGE_USER_NAME = 'dotlity-userName';

  // DOM refs
  const settingsBtn = document.getElementById('appSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsClose = document.getElementById('settingsClose');
  const settingsSave = document.getElementById('settingsSave');
  const settingsUserName = document.getElementById('settingsUserName');
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



  function openSettings() {
    if (!settingsModal) return;
    if (settingsUserName) {
      settingsUserName.value = localStorage.getItem(STORAGE_USER_NAME) || '';
    }
    settingsModal.classList.remove('hidden');
    settingsModal.setAttribute('aria-hidden', 'false');
  }

  function closeSettings() {
    if (!settingsModal) return;
    settingsModal.classList.add('hidden');
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  function saveSettings() {
    const name = settingsUserName ? settingsUserName.value.trim() : '';
    if (typeof localStorage !== 'undefined') {
      if (name) localStorage.setItem(STORAGE_USER_NAME, name);
      else localStorage.removeItem(STORAGE_USER_NAME);
    }
    closeSettings();
    // Greeting updates on next updateTime() tick (every 1s), or dispatch so time-weather can refresh once
    document.dispatchEvent(new CustomEvent('dotlity-settings-saved'));
  }

  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (settingsClose) settingsClose.addEventListener('click', closeSettings);
  if (settingsSave) settingsSave.addEventListener('click', saveSettings);
  if (settingsBackdrop) settingsBackdrop.addEventListener('click', closeSettings);
})();
