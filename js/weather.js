(function () {

  // DOM refs
  const headerWeatherText = document.getElementById('headerWeatherText');
  const headerWeatherIcon = document.getElementById('headerWeatherIcon');

  // if id isn't found, return to prevent page from breaking
  if (!headerWeatherText || !headerWeatherIcon) return;

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

          // Use location to get weather data
          /*
          latitude and longitude based on ipapi
          current=is-day: is the current day or night
          temperature_2m: the temperature in degrees Celsius
          weather_code: the weather code
          timezone: the timezone
          */
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=is_day,temperature_2m,weather_code&timezone=auto`;

          const res = await fetch(url); // fetch weather data from open-meteo
          const data = await res.json(); // parse JSON response
          const cur = data.current; // current weather data
          const tempC = Math.round(cur.temperature_2m); // temperature in degrees Celsius
          const desc = getWeatherDescription(cur.weather_code); // weather description
          headerWeatherText.textContent = tempC + '°C, ' + desc; // display temperature and weather description
          headerWeatherIcon.textContent = getWeatherIcon(cur.weather_code, cur.is_day === 1); // display weather icon

      } catch (e) {
          // If anything fails, show placeholder instead of breaking
          if (headerWeatherText) headerWeatherText.textContent = '--°C';
      }
  }

  fetchWeather();

})();