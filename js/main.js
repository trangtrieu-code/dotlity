/**
 * Entry point: import scripts in order. Load this once in index.html with type="module".
 * Run the app over HTTP (e.g. Live Server) — ES modules don't work with file://.
 */

// Optional: shared helpers first (if you add storage.js / confirm.js)
// import './storage.js';
// import './confirm.js';

import './app.js';
import './settings.js';
import './time-weather.js';
import './pomodoro.js';
import './notes.js';
import './todo.js';
import './music.js';
import './ambient.js';
import './dateTime.js';

// Optional: use your Time class from time.js somewhere, e.g. in time-weather.js
// import Time from './time.js';
