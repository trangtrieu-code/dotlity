/**
 * Pomodoro timer: 25 min focus, 10 min short break, 30 min long break.
 * Long break after every 3 completed focus sessions. Session count + notifications between sections/breaks.
 */
(function () {
  // --- Constants (minutes) ---
  const FOCUS_MIN = 1;
  const SHORT_BREAK_MIN = 1;
  const LONG_BREAK_MIN = 1;
  const SECTIONS_BEFORE_LONG = 3;

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

  if (!display || !progressBar) return;

  // --- State ---
  let phase = 'focus';
  let focusCountInRound = 0;
  let sessionsCompleted = 0;
  let timeLeft = FOCUS_MIN * 60;
  let phaseDuration = FOCUS_MIN * 60;
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
    if (p === 'focus') return FOCUS_MIN * 60;
    if (p === 'short') return SHORT_BREAK_MIN * 60;
    return LONG_BREAK_MIN * 60;
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

  if (playPauseBtn) playPauseBtn.addEventListener('click', handlePlayPause);
  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  if (stopBtn) stopBtn.addEventListener('click', handleStop);
  if (skipBtn) skipBtn.addEventListener('click', handleSkip);

  startPhase('focus'); // init UI
})();
