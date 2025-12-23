// IIFE: wraps code so variables don't pollute global scope
(function () {
  // Get references to HTML elements by their IDs
  const headerTime = document.getElementById('headerTime');
  const headerGreeting = document.getElementById('headerGreeting');
  const headerWeatherText = document.getElementById('headerWeatherText');
  const headerWeatherIcon = document.getElementById('headerWeatherIcon');

  // Early return if element doesn't exist (prevents errors)
  if (!headerTime) return;

  // Static greeting
  headerGreeting.textContent = 'Hello';

  // Live local time — update every second
  function updateTime() {
    // toLocaleTimeString formats date as readable time (e.g., "3:45 PM")
    headerTime.textContent = new Date().toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  }
  updateTime(); // Run once immediately
  setInterval(updateTime, 1000); // Then update every 1000ms (1 second)

  // Weather from Open-Meteo (need lat/lon from IP)
  // async/await lets us wait for API responses without blocking the page
  async function fetchWeather() {
    try {
      // Get user's location from IP address
      const locRes = await fetch('https://ipapi.co/json/'); // Fetch location data from IPAPI
      const loc = await locRes.json(); // Parse JSON response
      const lat = loc.latitude;
      const lon = loc.longitude;
      if (lat == null || lon == null) throw new Error('No location');

      // Use location to get weather data
      // Template literal (backticks) lets us insert variables into strings
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
      const res = await fetch(url); 
      const data = await res.json();
      const cur = data.current;
      const tempC = Math.round(cur.temperature_2m);
      headerWeatherText.textContent = tempC + '°C';
      
      // Ternary operator: if weather_code is 0 (clear), show sun, else cloud
      headerWeatherIcon.textContent = cur.weather_code === 0 ? 'wb_sunny' : 'cloud';
    } catch (e) {
      // If anything fails, show placeholder instead of breaking
      headerWeatherText.textContent = '--°C';
    }
  }
  fetchWeather();
})();
