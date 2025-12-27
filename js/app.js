(function () {
  // ----- Helper: turn "notes" into "widgetNotes" so we can find the panel in the HTML -----
  function getWidgetId(widgetName) {
    const firstLetter = widgetName.charAt(0).toUpperCase();
    const rest = widgetName.slice(1);
    return 'widget' + firstLetter + rest;
  }

  // ----- Helper: set nav button active if its panel is visible, inactive if hidden -----
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

  // ----- Nav bar: when you click a widget button, show or hide that panel -----
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

  // ----- Close button on each widget: hide that panel -----
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

  // ----- Dragging: drag a widget by its header to move it -----
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

  // ----- Settings button: will open settings modal later -----
  const settingsBtn = document.getElementById('appSettingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function () {
      // TODO: open settings modal
    });
  }
})();
