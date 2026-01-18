/**
 * Pomodoro timer: 25 min focus, 10 min short break, 30 min long break.
 * Long break runs after every 3 completed focus sessions.
 */
(function () {
  // --- Constants (minutes) ---
  var FOCUS_MIN = 25;
  var SHORT_BREAK_MIN = 10;
  var LONG_BREAK_MIN = 30;
  var SECTIONS_BEFORE_LONG = 3; // number of focus sessions before a long break

  // --- DOM refs ---
  var display = document.getElementById('pomodoroDisplay');
  var progressBar = document.getElementById('pomodoroProgressBar');
  var statusEl = document.getElementById('pomodoroStatus');
  var sessionCountEl = document.getElementById('pomodoroSessionCount');
  var phaseLabel = document.getElementById('pomodoroPhaseLabel');
  var playPauseBtn = document.getElementById('pomodoroPlayPause');
  var playIcon = document.getElementById('pomodoroPlayIcon');
  var resetBtn = document.getElementById('pomodoroReset');
  var stopBtn = document.getElementById('pomodoroStop');
  var skipBtn = document.getElementById('pomodoroSkip');

  if (!display || !progressBar) return;

  // --- State ---
  var phase = 'focus';           // 'focus' | 'short' | 'long'
  var focusCountInRound = 0;     // focus sessions done in current round (before long break)
  var sessionsCompleted = 0;     // total completed focus sessions (shown in UI)
  var timeLeft = FOCUS_MIN * 60; // seconds remaining in current phase
  var phaseDuration = FOCUS_MIN * 60;
  var isRunning = false;
  var tickId = null;             // setInterval id for the 1s tick

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

  /** Switch to phase p and reset timer to full duration. */
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
   * false when user skips (no count). After 3 focus sessions we do long break, else short.
   */
  function goNextPhase(countSession) {
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
  }

  // --- UI updates ---
  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateDisplay() {
    display.textContent = formatTime(timeLeft);
    if (sessionCountEl) sessionCountEl.textContent = sessionsCompleted;
  }

  /** Progress bar fills left-to-right as time counts down (elapsed %). */
  function updateProgress() {
    var pct = phaseDuration ? ((phaseDuration - timeLeft) / phaseDuration) * 100 : 0;
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
