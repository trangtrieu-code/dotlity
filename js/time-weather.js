// IIFE: wraps code so variables don't pollute global scope
(function () {
  const headerTime = document.getElementById('headerTime');
  const headerGreeting = document.getElementById('headerGreeting');
  const headerWeatherText = document.getElementById('headerWeatherText');
  const headerWeatherIcon = document.getElementById('headerWeatherIcon');

  // Default timezone is UTC
  let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  if (!headerTime) return;

  /** Map Open-Meteo weather_code (number) to short description string. */
  function getWeatherDescription(code) {
    const codes = {
      0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Foggy',
      51: 'Light drizzle', 53: 'Drizzle', 55: 'Drizzle',
      61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
      71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
      80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
      95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };
    return codes[code] || 'Unknown';
  }

  /** True if hour in timezone is between 6 and 20 (for sun vs moon icon). */
  function isDaytime(timezone) {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour >= 6 && hour < 20;
  }

  /** Icon name for Material Symbols: sunny, cloudy, night, rain, snow, thunder. */
  function getWeatherIcon(code, isDay) {
    if (code >= 95 && code <= 99) return 'thunderstorm';
    if (code >= 71 && code <= 77) return 'ac_unit';        // snow
    if (code >= 51 && code <= 82) return 'rainy';          // drizzle, rain, showers
    if (code >= 45 && code <= 48) return 'cloud';         // fog
    if (code >= 2 && code <= 3) return 'cloud';           // partly cloudy, overcast
    return isDay ? 'wb_sunny' : 'nightlight_round';       // clear: sun or moon
  }

  const STORAGE_USER_NAME = 'dotlity-userName';

  /** 0–11 Morning, 12–17 Afternoon, 18–23 Evening */
  function getGreeting(timezone) {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
    const hour = parseInt(formatter.format(new Date()), 10);
    let base = 'Good Morning';
    if (hour >= 12 && hour < 18) base = 'Good Afternoon';
    else if (hour >= 18) base = 'Good Evening';
    const name = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_USER_NAME)) || '';
    const trimmed = name.trim();
    return trimmed ? base + ', ' + trimmed : base;
  }

  // Live local time — update every second
  function updateTime() {
    headerTime.textContent = new Date().toLocaleTimeString('en-US', {
      timeZone: userTimezone,
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
    if (headerGreeting) headerGreeting.textContent = getGreeting(userTimezone);
  }
  updateTime(); // Run once immediately
  setInterval(updateTime, 1000); // Then update every 1000ms (1 second)
  document.addEventListener('dotlity-settings-saved', updateTime); // Update greeting as soon as name is saved

  // Weather from Open-Meteo (need lat/lon from IP)
  // async/await lets us wait for API responses without blocking the page
  async function fetchWeather() {
    try {
      // Get user's location from IP address
      const locRes = await fetch('https://ipapi.co/json/'); // Fetch location data from IPAPI
      const loc = await locRes.json(); // Parse JSON response
      const lat = loc.latitude;
      const lon = loc.longitude;
      if (loc.timezone) userTimezone = loc.timezone;
      if (lat == null || lon == null) throw new Error('No location');

      // Use location to get weather data
      // Template literal (backticks) lets us insert variables into strings
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
      const res = await fetch(url); 
      const data = await res.json();
      const cur = data.current;
      const tempC = Math.round(cur.temperature_2m);
      headerWeatherText.textContent = tempC + '°C';

      const isDay = isDaytime(userTimezone);
      headerWeatherIcon.textContent = getWeatherIcon(cur.weather_code, isDay);
    } catch (e) {
      // If anything fails, show placeholder instead of breaking
      headerWeatherText.textContent = '--°C';
    }
  }
  fetchWeather();
})();
