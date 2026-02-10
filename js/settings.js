(function () {
  const STORAGE_USER_NAME = 'dotlity-userName';
  const STORAGE_BG_IMAGE = 'dotlity-bgImage';
  const STORAGE_CUSTOM_BG = 'dotlity-customBg';
  const PICSUM_BASE = 'https://picsum.photos';

  const settingsBtn = document.getElementById('appSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsClose = document.getElementById('settingsClose');
  const settingsSave = document.getElementById('settingsSave');
  const settingsUserName = document.getElementById('settingsUserName');
  const settingsCustomBg = document.getElementById('settingsCustomBg');
  const settingsNewBgBtn = document.getElementById('settingsNewBgBtn');
  const settingsBackdrop = settingsModal ? settingsModal.querySelector('.settings-backdrop') : null;

  const settingsSnapshot = { customBg: false, bgImage: null, name: '' };
  let draftCustomBg = false;
  let draftBgImage = null;

  function applyToBodyOnly(url) {
    const body = document.body;
    if (!url) {
      body.classList.remove('custom-bg');
      body.style.backgroundImage = '';
      return;
    }
    body.classList.add('custom-bg');
    body.style.backgroundImage = 'url("' + url + '")';
  }

  function restoreSnapshot() {
    if (settingsSnapshot.customBg && settingsSnapshot.bgImage) {
      applyToBodyOnly(settingsSnapshot.bgImage);
    } else {
      applyToBodyOnly(null);
    }
  }

  function setCustomBgFromCheckbox() {
    if (!settingsCustomBg) return;
    draftCustomBg = settingsCustomBg.checked;
    if (!draftCustomBg) {
      restoreSnapshot();
    }
  }

  function loadNewBackground() {
    if (!settingsNewBgBtn) return;
    settingsNewBgBtn.disabled = true;
    settingsNewBgBtn.textContent = 'Loading…';
    const img = new Image();
    const url = PICSUM_BASE + '/1920/1080?random=' + Date.now();
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

  function closeSettings(restore) {
    if (!settingsModal) return;
    if (restore !== false) restoreSnapshot();
    settingsModal.classList.add('hidden');
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  function saveSettings() {
    const name = settingsUserName ? settingsUserName.value.trim() : '';
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

  (function () {
    try {
      const useCustom = localStorage.getItem(STORAGE_CUSTOM_BG) === 'true';
      const saved = localStorage.getItem(STORAGE_BG_IMAGE);
      if (useCustom && saved) {
        document.body.classList.add('custom-bg');
        document.body.style.backgroundImage = 'url("' + saved + '")';
      }
    } catch (e) {}
  })();
})();
