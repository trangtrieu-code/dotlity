(function () {

  // Constants
  const ALBUMS_URL = 'assets/music/data/albums.json';
  const MUSIC_BASE = 'assets/music/music/';

  // DOM refs
  const audio = document.getElementById('musicAudio');
  const musicTrackTitle = document.getElementById('musicTrackTitle');
  const musicTimeCurrent = document.getElementById('musicTimeCurrent');
  const musicTimeTotal = document.getElementById('musicTimeTotal');
  const musicProgressBar = document.getElementById('musicProgressBar');
  const musicProgressFill = document.getElementById('musicProgressFill');
  const musicPlayPause = document.getElementById('musicPlayPause');
  const musicPlayIcon = document.getElementById('musicPlayIcon');
  const musicPrev = document.getElementById('musicPrev');
  const musicNext = document.getElementById('musicNext');
  const musicShuffle = document.getElementById('musicShuffle');
  const musicRepeat = document.getElementById('musicRepeat');
  const musicRepeatIcon = document.getElementById('musicRepeatIcon');
  const musicVolumeSlider = document.getElementById('musicVolumeSlider');
  const musicTrackCount = document.getElementById('musicTrackCount');
  const musicBurger = document.getElementById('musicBurger');
  const musicAlbumDropdown = document.getElementById('musicAlbumDropdown');
  const musicAlbumList = document.getElementById('musicAlbumList');

  // Check if DOM refs are available
  if (!audio || !musicProgressBar) return;

  // Playlist: array of { url, title }
  let playlist = [];
  let currentIndex = 0;
  let repeatMode = 0; // 0 off, 1 one, 2 all
  let shuffleOn = false;
  let albumsData = null;

  // Load albums from JSON
  function loadAlbums() {
    fetch(ALBUMS_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        albumsData = data;
        renderAlbumList();
      })
      .catch(function (err) {
        console.warn('Music: could not load albums', err);
      });
  }

  // Render album list
  function renderAlbumList() {
    if (!musicAlbumList || !albumsData) return;
    musicAlbumList.innerHTML = '';
    const keys = Object.keys(albumsData);
    keys.forEach(function (key) {
      const album = albumsData[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';
      btn.textContent = album.name;
      btn.addEventListener('click', function () {
        selectAlbum(key);
        musicAlbumDropdown.classList.add('hidden');
      });
      musicAlbumList.appendChild(btn);
    });
  }

  // Build playlist when user picks an album
  function selectAlbum(albumKey) {
    const album = albumsData && albumsData[albumKey];
    if (!album) return;
    const folder = album.folder;
    playlist = (album.tracks || []).map(function (file) {
      const title = file.replace(/\.mp3$/i, '');
      return { url: MUSIC_BASE + folder + '/' + file, title: title };
    });
    currentIndex = 0;
    if (musicTrackCount) musicTrackCount.textContent = playlist.length;
    if (playlist.length > 0) {
      if (musicTrackTitle) musicTrackTitle.textContent = playlist[0].title;
      loadTrack(0);
    } else {
      if (musicTrackTitle) musicTrackTitle.textContent = 'No tracks';
    }
  }

  // Load track
  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[index];
    audio.src = track.url;
    if (musicTrackTitle) musicTrackTitle.textContent = track.title;
    audio.load();
  }

  // Format time
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Update time display
  function updateTimeDisplay() {
    if (musicTimeCurrent) musicTimeCurrent.textContent = formatTime(audio.currentTime);
    if (musicTimeTotal) musicTimeTotal.textContent = formatTime(audio.duration);
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    if (musicProgressFill) musicProgressFill.style.width = pct + '%';
  }

  // Play / pause / prev / next
  function play() {
    if (playlist.length === 0) return;
    audio.play();
    if (musicPlayIcon) musicPlayIcon.textContent = 'pause';
  }

  // Pause
  function pause() {
    audio.pause();
    if (musicPlayIcon) musicPlayIcon.textContent = 'play_arrow';
  }

  // Toggle play/pause
  function togglePlayPause() {
    if (audio.paused) {
      if (playlist.length === 0 && albumsData) {
        const keys = Object.keys(albumsData);
        if (keys.length > 0) selectAlbum(keys[0]);
      }
      play();
    } else {
      pause();
    }
  }

  // Go to next track
  function goNext() {
    if (repeatMode === 1) {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    const nextIdx = currentIndex + 1;
    if (nextIdx < playlist.length) {
      loadTrack(nextIdx);
      audio.play();
      if (musicPlayIcon) musicPlayIcon.textContent = 'pause';
    } else if (repeatMode === 2) {
      loadTrack(0);
      audio.play();
      if (musicPlayIcon) musicPlayIcon.textContent = 'pause';
    } else {
      pause();
    }
  }

  // Go to previous track
  function goPrev() {
    if (audio.currentTime > 2) {
      audio.currentTime = 0;
      return;
    }
    const prevIdx = currentIndex - 1;
    if (prevIdx >= 0) {
      loadTrack(prevIdx);
      audio.play();
      if (musicPlayIcon) musicPlayIcon.textContent = 'pause';
    } else {
      audio.currentTime = 0;
    }
  }

  // Seek bar: click to seek
  function seekTo(e) {
    const rect = musicProgressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (audio.duration) {
      audio.currentTime = pct * audio.duration;
      updateTimeDisplay();
    }
  }

  // Set volume
  function setVolume() {
    const val = musicVolumeSlider ? parseInt(musicVolumeSlider.value, 10) : 70;
    audio.volume = val / 100;
  }

  // Shuffle / repeat
  function toggleShuffle() {
    shuffleOn = !shuffleOn;
    if (shuffleOn && playlist.length > 1) {
      const current = playlist[currentIndex];
      const rest = playlist.filter(function (_, i) { return i !== currentIndex; });
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = rest[i];
        rest[i] = rest[j];
        rest[j] = t;
      }
      playlist = [current].concat(rest);
      currentIndex = 0;
    }
    musicShuffle.classList.toggle('text-primary', shuffleOn);
  }

  // Toggle repeat
  function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    if (musicRepeatIcon) {
      musicRepeatIcon.textContent = repeatMode === 1 ? 'repeat_one' : 'repeat';
    }
    musicRepeat.classList.toggle('text-primary', repeatMode > 0);
  }

  // Wire events
  if (musicPlayPause) musicPlayPause.addEventListener('click', togglePlayPause);
  if (musicPrev) musicPrev.addEventListener('click', goPrev);
  if (musicNext) musicNext.addEventListener('click', goNext);
  if (musicShuffle) musicShuffle.addEventListener('click', toggleShuffle);
  if (musicRepeat) musicRepeat.addEventListener('click', toggleRepeat);
  if (musicVolumeSlider) musicVolumeSlider.addEventListener('input', setVolume);
  if (musicProgressBar) musicProgressBar.addEventListener('click', seekTo);

  // Burger menu
  if (musicBurger) {
    musicBurger.addEventListener('click', function () {
      musicAlbumDropdown.classList.toggle('hidden');
    });
  }

  // Audio events
  audio.addEventListener('timeupdate', updateTimeDisplay);
  audio.addEventListener('loadedmetadata', function () {
    if (musicTimeTotal) musicTimeTotal.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('ended', goNext);

  // Initial setup
  setVolume();
  loadAlbums();
})();
