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
  const musicPrev = document.getElementById('musicPrev');
  const musicNext = document.getElementById('musicNext');
  const musicShuffle = document.getElementById('musicShuffle');
  const musicRepeat = document.getElementById('musicRepeat');
  const musicRepeatIcon = document.getElementById('musicRepeatIcon');
  const musicVolumeSlider = document.getElementById('musicVolumeSlider');
  const musicTrackCount = document.getElementById('musicTrackCount');
  const musicBurger = document.getElementById('musicBurger');
  const musicAlbumPanel = document.getElementById('musicAlbumPanel');
  const musicAlbumList = document.getElementById('musicAlbumList');
  const musicProgressHandle = document.getElementById('musicProgressHandle');
  const musicPlaylistBtn = document.getElementById('musicPlaylistBtn');
  const musicPlaylistPanel = document.getElementById('musicPlaylistPanel');
  const musicPlaylistContent = document.getElementById('musicPlaylistContent');
  const musicPlayIcon = document.querySelector('.music-play-icon');
  const musicPauseIcon = document.querySelector('.music-pause-icon');

  // Check if DOM refs are available
  if (!audio || !musicProgressBar) return;

  // Playlist: array of { url, title }
  let playlist = [];
  let currentIndex = 0;
  let currentAlbumKey = null;
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
      btn.className = 'music-dropdown-item' + (currentAlbumKey === key ? ' active' : '');
      btn.textContent = album.name;
      btn.addEventListener('click', function () {
        selectAlbum(key);
      });
      musicAlbumList.appendChild(btn);
    });
  }

  // Build playlist when user picks an album
  function selectAlbum(albumKey) {
    const album = albumsData && albumsData[albumKey];
    if (!album) return;
    currentAlbumKey = albumKey;
    const folder = album.folder;
    playlist = (album.tracks || []).map(function (file) {
      const title = file.replace(/\.mp3$/i, '');
      return { url: MUSIC_BASE + folder + '/' + file, title: title };
    });
    currentIndex = 0;
    if (musicTrackCount) musicTrackCount.textContent = playlist.length;
    renderAlbumList();
    renderPlaylistDropdown();
    if (playlist.length > 0) {
      if (musicTrackTitle) musicTrackTitle.textContent = playlist[0].title;
      loadTrack(0);
    } else {
      if (musicTrackTitle) musicTrackTitle.textContent = 'No tracks';
    }
  }

  // Render playlist list (current album tracks) in the right-hand Playlist panel
  function renderPlaylistDropdown() {
    if (!musicPlaylistContent) return;
    musicPlaylistContent.innerHTML = '';
    if (playlist.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.className = 'music-panel-placeholder';
      placeholder.textContent = 'Select an album to see tracks';
      musicPlaylistContent.appendChild(placeholder);
      return;
    }
    playlist.forEach(function (track, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'music-dropdown-item' + (i === currentIndex ? ' active' : '');
      btn.textContent = track.title;
      btn.addEventListener('click', function () {
        loadTrack(i);
        audio.play();
        if (musicPlayIcon) musicPlayIcon.classList.add('hidden');
        if (musicPauseIcon) musicPauseIcon.classList.remove('hidden');
        renderPlaylistDropdown();
      });
      musicPlaylistContent.appendChild(btn);
    });
  }

  // Load track
  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[index];
    audio.src = track.url;
    if (musicTrackTitle) musicTrackTitle.textContent = track.title;
    audio.load();
    if (musicPlaylistContent) renderPlaylistDropdown();
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
    if (musicProgressHandle) musicProgressHandle.style.left = pct + '%';
  }

  // Play 
  function play() {
    if (playlist.length === 0) return;
    audio.play();
    if (musicPlayIcon) musicPlayIcon.classList.add('hidden');
    if (musicPauseIcon) musicPauseIcon.classList.remove('hidden');
  }

  // Pause
  function pause() {
    audio.pause();
    if (musicPlayIcon) musicPlayIcon.classList.remove('hidden');
    if (musicPauseIcon) musicPauseIcon.classList.add('hidden');
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
      if (musicPlayIcon) musicPlayIcon.classList.add('hidden');
      if (musicPauseIcon) musicPauseIcon.classList.remove('hidden');
    } else if (repeatMode === 2) {
      loadTrack(0);
      audio.play();
      if (musicPlayIcon) musicPlayIcon.classList.add('hidden');
      if (musicPauseIcon) musicPauseIcon.classList.remove('hidden');
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
      if (musicPlayIcon) musicPlayIcon.classList.add('hidden');
      if (musicPauseIcon) musicPauseIcon.classList.remove('hidden');
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

  // Shuffle
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
    if (musicShuffle) musicShuffle.classList.toggle('active', shuffleOn);
  }

  // Toggle repeat
  function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    if (musicRepeatIcon) {
      musicRepeatIcon.textContent = repeatMode === 1 ? 'repeat_one' : 'repeat';
    }
    if (musicRepeat) musicRepeat.classList.toggle('active', repeatMode > 0);
  }

  // Wire events
  if (musicPlayPause) musicPlayPause.addEventListener('click', togglePlayPause);
  if (musicPrev) musicPrev.addEventListener('click', goPrev);
  if (musicNext) musicNext.addEventListener('click', goNext);
  if (musicShuffle) musicShuffle.addEventListener('click', toggleShuffle);
  if (musicRepeat) musicRepeat.addEventListener('click', toggleRepeat);
  if (musicVolumeSlider) musicVolumeSlider.addEventListener('input', setVolume);
  if (musicProgressBar) musicProgressBar.addEventListener('click', seekTo);

  // Burger menu: toggle Albums panel (left)
  if (musicBurger && musicAlbumPanel) {
    musicBurger.addEventListener('click', function () {
      musicAlbumPanel.classList.toggle('visible');
    });
  }

  // Playlist button: toggle Playlist panel (right)
  if (musicPlaylistBtn && musicPlaylistPanel) {
    musicPlaylistBtn.addEventListener('click', function () {
      musicPlaylistPanel.classList.toggle('visible');
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
  renderPlaylistDropdown(); /* show "Select an album" in Playlist panel */
})();
