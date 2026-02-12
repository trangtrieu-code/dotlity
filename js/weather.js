(function () {

  const headerWeatherText = document.getElementById('headerWeatherText');
  const headerWeatherIcon = document.getElementById('headerWeatherIcon');
  const weatherForecastTemp = document.getElementById('weatherForecastTemp');
  const weatherForecastLocation = document.getElementById('weatherForecastLocation');
  const weatherForecastHumidity = document.getElementById('weatherForecastHumidity');
  const weatherForecastWind = document.getElementById('weatherForecastWind');
  const weatherForecastDays = document.getElementById('weatherForecastDays');

  if (!headerWeatherText || !headerWeatherIcon) return;

  const DAYS_TO_SHOW = 5;

  /** Format date string (YYYY-MM-DD) to short weekday (e.g. "Mon"). */
  function formatDayLabel(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  /** Render 5 forecast day slots. daily: { time, temperature_2m_max, temperature_2m_min, weather_code } or null for placeholders. */
  function renderForecastDays(daily) {
    if (!weatherForecastDays) return;
    const times = daily && daily.time ? daily.time.slice(0, DAYS_TO_SHOW) : [];
    const maxT = daily && daily.temperature_2m_max ? daily.temperature_2m_max : [];
    const minT = daily && daily.temperature_2m_min ? daily.temperature_2m_min : [];
    const codes = daily && daily.weather_code ? daily.weather_code : [];

    weatherForecastDays.innerHTML = '';
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const dayLabel = formatDayLabel(times[i]);
      const high = maxT[i] != null ? Math.round(maxT[i]) : '--';
      const low = minT[i] != null ? Math.round(minT[i]) : '--';
      const code = codes[i] != null ? codes[i] : 0;
      const icon = getWeatherIcon(code, true);

      const cell = document.createElement('div');
      cell.className = 'flex flex-col items-center gap-1';
      cell.innerHTML =
        '<span class="text-xs font-medium text-slate-400 uppercase">' + dayLabel + '</span>' +
        '<span class="material-symbols-outlined text-primary text-lg">' + icon + '</span>' +
        '<div class="text-xs font-semibold text-slate-800 dark:text-slate-100">' + high + '°<span class="text-slate-400 font-normal">/' + low + '°</span></div>';
      weatherForecastDays.appendChild(cell);
    }
  }

  /** Convert wind direction degrees to compass label (e.g. 315 -> "NW"). */
  function windDirectionLabel(degrees) {
    if (degrees == null || isNaN(degrees)) return '';
    const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((degrees % 360) / 45)) % 8;
    return labels[idx] || '';
  }

  /** Short weather description for display (e.g. "Sunny", "Cloudy"). */
  function getWeatherDescription(code) {
  const codes = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Cloudy',
    45: 'Foggy', 48: 'Foggy',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
    95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
  };
  return codes[code] || 'Unknown';
}

/** Icons from Google Fonts: sunny, cloudy, night, rain, snow, thunder. */
function getWeatherIcon(code, isDay) {
  if (code >= 95 && code <= 99) return 'thunderstorm';    // thunderstorm
  if (code >= 71 && code <= 77) return 'ac_unit';        // snow
  if (code >= 51 && code <= 82) return 'rainy';          // drizzle, rain, showers
  if (code >= 45 && code <= 48) return 'cloud';         // fog
  if (code >= 2 && code <= 3) return 'cloud';           // partly cloudy, overcast
  return isDay ? 'wb_sunny' : 'nightlight_round';       // clear: sun or moon
}

  async function fetchWeather() {
      try {
          // Get user's location from IP address
          const locRes = await fetch('https://ipapi.co/json/'); // Fetch location data from IPAPI
          const loc = await locRes.json(); // Parse JSON response
          const lat = loc.latitude;
          const lon = loc.longitude;

          if (lat == null || lon == null) throw new Error('No location');

          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=is_day,temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

          const res = await fetch(url);
          const data = await res.json();
          const cur = data.current;

          const tempC = Math.round(cur.temperature_2m);
          const desc = getWeatherDescription(cur.weather_code);
          headerWeatherText.textContent = tempC + '°C, ' + desc;
          headerWeatherIcon.textContent = getWeatherIcon(cur.weather_code, cur.is_day === 1);

          const locationParts = [loc.city, loc.region, loc.country_name].filter(Boolean);
          const locationStr = locationParts.length ? locationParts.join(', ') : 'Unknown';

          if (weatherForecastTemp) weatherForecastTemp.textContent = tempC + '°';
          if (weatherForecastLocation) weatherForecastLocation.textContent = locationStr;
          if (weatherForecastHumidity) weatherForecastHumidity.textContent = (cur.relative_humidity_2m != null ? Math.round(cur.relative_humidity_2m) : '--') + '%';
          if (weatherForecastWind) {
            const speed = cur.wind_speed_10m != null ? Math.round(cur.wind_speed_10m) : '';
            const dir = windDirectionLabel(cur.wind_direction_10m);
            weatherForecastWind.textContent = speed ? (dir ? speed + ' km/h ' + dir : speed + ' km/h') : '--';
          }

          renderForecastDays(data.daily || null);

      } catch (e) {
          if (headerWeatherText) headerWeatherText.textContent = '--°C';
          if (weatherForecastTemp) weatherForecastTemp.textContent = '--°';
          if (weatherForecastLocation) weatherForecastLocation.textContent = '--';
          if (weatherForecastHumidity) weatherForecastHumidity.textContent = '--%';
          if (weatherForecastWind) weatherForecastWind.textContent = '--';
          renderForecastDays(null);
      }
  }

  renderForecastDays(null);
  fetchWeather();

  // Open weather forecast popup when clicking header weather
  const headerWeatherTrigger = document.getElementById('headerWeatherTrigger');
  const weatherForecastPopup = document.getElementById('weatherForecastPopup');
  const weatherForecastClose = document.getElementById('weatherForecastClose');
  const weatherForecastBackdrop = document.getElementById('weatherForecastBackdrop');

  function openWeatherForecast() {
    if (!weatherForecastPopup) return;
    weatherForecastPopup.classList.remove('hidden');
    weatherForecastPopup.setAttribute('aria-hidden', 'false');
  }

  function closeWeatherForecast() {
    if (!weatherForecastPopup) return;
    weatherForecastPopup.classList.add('hidden');
    weatherForecastPopup.setAttribute('aria-hidden', 'true');
  }

  if (headerWeatherTrigger) headerWeatherTrigger.addEventListener('click', openWeatherForecast);
  if (weatherForecastClose) weatherForecastClose.addEventListener('click', closeWeatherForecast);
  if (weatherForecastBackdrop) weatherForecastBackdrop.addEventListener('click', closeWeatherForecast);

})();