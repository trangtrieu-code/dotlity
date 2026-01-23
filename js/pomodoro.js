/**
 * Pomodoro timer: configurable focus / short break / long break. Long break after every 3 focus sessions.
 * Session count, confirmation popup between sections, settings persisted to localStorage.
 */
(function () {
  const STORAGE_SETTINGS = 'dotlity-pomodoro-settings';
  const SECTIONS_BEFORE_LONG = 3;
  const DEFAULT_SETTINGS = { focusDuration: 25, shortBreakDuration: 10, longBreakDuration: 30 };

  function loadSettings() {
    try {
      const s = localStorage.getItem(STORAGE_SETTINGS);
      if (s) {
        const parsed = JSON.parse(s);
        return {
          focusDuration: Math.max(1, Math.min(120, parseInt(parsed.focusDuration, 10) || 25)),
          shortBreakDuration: Math.max(1, Math.min(60, parseInt(parsed.shortBreakDuration, 10) || 10)),
          longBreakDuration: Math.max(1, Math.min(60, parseInt(parsed.longBreakDuration, 10) || 30))
        };
      }
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
  }

  function saveSettingsToStorage(settings) {
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }

  // --- DOM refs ---
  const display = document.getElementById('pomodoroDisplay');
  const progressBar = document.getElementById('pomodoroProgressBar');
  const statusEl = document.getElementById('pomodoroStatus');
  const sessionCountEl = document.getElementById('pomodoroSessionCount');
  const phaseLabel = document.getElementById('pomodoroPhaseLabel');
  const playPauseBtn = document.getElementById('pomodoroPlayPause');
  const playIcon = document.getElementById('pomodoroPlayIcon');
  const resetBtn = document.getElementById('pomodoroReset');
  const stopBtn = document.getElementById('pomodoroStop');
  const skipBtn = document.getElementById('pomodoroSkip');
  const settingsOverlay = document.getElementById('pomodoroSettingsOverlay');
  const settingsCloseBtn = document.getElementById('pomodoroSettingsClose');
  const settingsSaveBtn = document.getElementById('pomodoroSettingsSave');
  const focusDurationInput = document.getElementById('pomodoroFocusDuration');
  const shortBreakDurationInput = document.getElementById('pomodoroShortBreakDuration');
  const longBreakDurationInput = document.getElementById('pomodoroLongBreakDuration');

  if (!display || !progressBar) return;

  // --- State ---
  let settings = loadSettings();
  let phase = 'focus';
  let focusCountInRound = 0;
  let sessionsCompleted = 0;
  let timeLeft = settings.focusDuration * 60;
  let phaseDuration = settings.focusDuration * 60;
  let isRunning = false;
  let tickId = null;

  // --- Confirmation popup (when a section/break ends) ---
  const confirmOverlay = document.getElementById('pomodoroConfirmOverlay');
  const confirmMessage = document.getElementById('pomodoroConfirmMessage');
  const confirmOkBtn = document.getElementById('pomodoroConfirmOk');

  /** Play a short beep. */
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  /** Show in-app confirmation popup with message; on OK close and optionally start next phase. */
  function showConfirmPopup(message, onOk) {
    playBeep();
    if (confirmMessage) confirmMessage.textContent = message;
    if (confirmOverlay) {
      confirmOverlay.classList.remove('hidden');
      confirmOverlay.setAttribute('aria-hidden', 'false');
    }
    function closePopup() {
      if (confirmOverlay) {
        confirmOverlay.classList.add('hidden');
        confirmOverlay.setAttribute('aria-hidden', 'true');
      }
      if (typeof onOk === 'function') onOk();
    }
    if (confirmOkBtn) {
      confirmOkBtn.onclick = closePopup;
    }
  }

  // --- Phase helpers ---
  function phaseDurationSeconds(p) {
    if (p === 'focus') return settings.focusDuration * 60;
    if (p === 'short') return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  }

  /** Apply current settings to timer (when not running: reset current phase duration and display). */
  function applySettings() {
    phaseDuration = phaseDurationSeconds(phase);
    if (!isRunning) {
      timeLeft = phaseDuration;
      updateDisplay();
      updateProgress();
    }
  }

  function phaseLabelText(p) {
    if (p === 'focus') return 'Focus Session';
    if (p === 'short') return 'Short Break';
    return 'Long Break';
  }

  function startPhase(p) {
    phase = p;
    phaseDuration = phaseDurationSeconds(p);
    timeLeft = phaseDuration;
    if (phaseLabel) phaseLabel.textContent = phaseLabelText(p);
    updateDisplay();
    updateProgress();
  }

  /**
   * Advance to next phase. countSession: true when focus finished naturally (counts session);
   * false when skipped. After 3 focus sessions → long break, else short break.
   */
  function goNextPhase(countSession) {
    const wasFocus = phase === 'focus';
    const wasShort = phase === 'short';
    const wasLong = phase === 'long';

    if (phase === 'focus') {
      if (countSession) {
        sessionsCompleted++;
        focusCountInRound++;
      }
      if (focusCountInRound >= SECTIONS_BEFORE_LONG) {
        startPhase('long');
        focusCountInRound = 0;
      } else {
        startPhase('short');
      }
    } else if (phase === 'short') {
      startPhase('focus');
    } else {
      startPhase('focus');
    }

    // Show confirmation popup when a section/break just ended (not on skip); on OK start next phase.
    if (countSession) {
      if (wasFocus) {
        showConfirmPopup(
          phase === 'long' ? 'Focus done! Time for a long break.' : 'Focus done! Time for a short break.',
          startTick
        );
      } else if (wasShort || wasLong) {
        showConfirmPopup('Break over. Time to focus.', startTick);
      }
    }
  }

  // --- UI updates ---
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateDisplay() {
    display.textContent = formatTime(timeLeft);
    if (sessionCountEl) sessionCountEl.textContent = sessionsCompleted;
  }

  /** Progress bar fills left-to-right as time counts down (elapsed %). */
  function updateProgress() {
    const pct = phaseDuration ? ((phaseDuration - timeLeft) / phaseDuration) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  function updateStatus() {
    if (!statusEl) return;
    if (isRunning) {
      statusEl.textContent = phase === 'focus' ? 'Time to focus!' : 'Take a break';
    } else {
      statusEl.textContent = phase === 'focus' ? 'Ready to focus' : 'Break time';
    }
  }

  // --- Tick & interval ---
  function tick() {
    if (!isRunning) return;
    timeLeft--;
    updateDisplay();
    updateProgress();
    if (timeLeft <= 0) {
      stopTick();
      goNextPhase(true); // phase ended naturally, count session if focus
      if (playPauseBtn) playPauseBtn.focus();
    }
  }

  function startTick() {
    if (tickId) return;
    isRunning = true;
    if (playIcon) playIcon.textContent = 'pause';
    updateStatus();
    tickId = setInterval(tick, 1000);
  }

  function stopTick() {
    isRunning = false;
    if (playIcon) playIcon.textContent = 'play_arrow';
    updateStatus();
    if (tickId) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  // --- Button handlers ---
  function handlePlayPause() {
    if (isRunning) stopTick();
    else startTick();
  }

  function handleReset() {
    stopTick();
    startPhase(phase); // restart current phase from full duration
  }

  function handleStop() {
    stopTick();
    startPhase(phase);
  }

  function handleSkip() {
    stopTick();
    goNextPhase(false); // don't count as completed session
  }

  // --- Settings modal ---
  function openSettings() {
    if (focusDurationInput) focusDurationInput.value = settings.focusDuration;
    if (shortBreakDurationInput) shortBreakDurationInput.value = settings.shortBreakDuration;
    if (longBreakDurationInput) longBreakDurationInput.value = settings.longBreakDuration;
    if (settingsOverlay) {
      settingsOverlay.classList.remove('hidden');
      settingsOverlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeSettings() {
    if (settingsOverlay) {
      settingsOverlay.classList.add('hidden');
      settingsOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  function saveSettings() {
    const focus = Math.max(1, Math.min(120, parseInt(focusDurationInput?.value, 10) || 25));
    const short = Math.max(1, Math.min(60, parseInt(shortBreakDurationInput?.value, 10) || 10));
    const long = Math.max(1, Math.min(60, parseInt(longBreakDurationInput?.value, 10) || 30));
    settings = { focusDuration: focus, shortBreakDuration: short, longBreakDuration: long };
    saveSettingsToStorage(settings);
    applySettings();
    closeSettings();
  }

  if (playPauseBtn) playPauseBtn.addEventListener('click', handlePlayPause);
  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  if (stopBtn) stopBtn.addEventListener('click', handleStop);
  if (skipBtn) skipBtn.addEventListener('click', handleSkip);

  document.getElementById('pomodoroSettingsBtn')?.addEventListener('click', openSettings);
  if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeSettings);
  if (settingsSaveBtn) settingsSaveBtn.addEventListener('click', saveSettings);
  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeSettings(); });
  }

  startPhase('focus'); // init UI
})();
