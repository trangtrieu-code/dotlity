/**
 * ambient.js - Ambient Sounds widget
 * Grid of sound icons; click cycles volume: muted → low → medium → max → muted. Audio from assets/ambient.
 */
(function () {
  const AMBIENT_BASE = 'assets/ambient';
  const VOLUME_LEVELS = {
    muted: 0,
    low: 0.25,
    medium: 0.5,
    max: 1.0
  };

  const soundNames = [
    'rain', 'thunder', 'wind', 'river',
    'fire', 'chime', 'forest', 'cricket'
  ];

  const container = document.getElementById('ambientSounds');
  if (!container) return;

  /** Per-sound state: { audio, volState: 'muted'|'low'|'medium'|'max', element (img) }. */
  const soundState = {};

  /** On icon click: cycle volState and set audio.volume + img class (muted/low/medium/max). */
  function handleSoundClick(soundName) {
    const state = soundState[soundName];
    if (!state) return;

    const audio = state.audio;
    const img = state.element;
    const currentState = state.volState;

    if (currentState === 'muted') {
      state.volState = 'low';
      audio.volume = VOLUME_LEVELS.low;
      img.className = 'ambient-icon low';
      audio.play().catch(function () {
        state.volState = 'muted';
        img.className = 'ambient-icon muted';
      });
    } else if (currentState === 'low') {
      state.volState = 'medium';
      audio.volume = VOLUME_LEVELS.medium;
      img.className = 'ambient-icon medium';
    } else if (currentState === 'medium') {
      state.volState = 'max';
      audio.volume = VOLUME_LEVELS.max;
      img.className = 'ambient-icon max';
    } else {
      state.volState = 'muted';
      audio.volume = VOLUME_LEVELS.muted;
      img.className = 'ambient-icon muted';
      audio.pause();
      audio.currentTime = 0;
    }
  }

  for (let i = 0; i < soundNames.length; i++) {
    const name = soundNames[i];
    const audioUrl = AMBIENT_BASE + '/noises/' + name + '.mp3';
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = 0;

    audio.addEventListener('ended', function () {
      if (audio.volume > 0) {
        audio.currentTime = 0;
        audio.play();
      }
    });

    soundState[name] = {
      audio: audio,
      volState: 'muted',
      element: null
    };

    const item = document.createElement('div');
    item.className = 'ambient-item';
    item.setAttribute('data-sound', name);

    const iconWrap = document.createElement('div');
    iconWrap.className = 'ambient-icon-wrap';
    iconWrap.title = 'Click to cycle volume: muted → low → medium → max';

    const img = document.createElement('img');
    img.src = AMBIENT_BASE + '/icons/' + name + '.png';
    img.alt = name;
    img.className = 'ambient-icon muted';
    img.loading = 'lazy';
    iconWrap.appendChild(img);

    soundState[name].element = img;

    const label = document.createElement('div');
    label.className = 'ambient-label';
    label.textContent = name;

    iconWrap.addEventListener('click', function () {
      handleSoundClick(name);
    });

    item.appendChild(iconWrap);
    item.appendChild(label);
    container.appendChild(item);
  }
})();
