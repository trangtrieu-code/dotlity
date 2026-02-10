(function () {
    // DOM refs
    const headerTime = document.getElementById('headerTime');
    const headerGreeting = document.getElementById('headerGreeting');

    // Default timezone is UTC
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    // Use system language for date/time format (e.g. vi-VN, en-US)
    const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';

    // if id isn't found, return to prevent page from breaking
    if (!headerTime) return;

    /** Current hour (0–23) in user's timezone (from JS). */
    function getHourIn() {
        return +new Date().toLocaleString(locale, { timeZone: userTimezone, hour: 'numeric', hour12: false });
    }

    /** Greeting from current hour in user's timezone. */
    function getGreeting() {
      const hour = getHourIn();
      if (hour >= 0 && hour < 6) return 'Good night';
      if (hour >= 12 && hour < 18) return 'Good Afternoon';
      if (hour >= 18) return 'Good Evening';
      return 'Good Morning';
    }

    function updateDateTime() {
        const now = new Date();
        // date
        const dateStr = now.toLocaleDateString(locale, {
            timeZone: userTimezone,
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
        // time
        const timeStr = now.toLocaleTimeString(locale, {
            timeZone: userTimezone,
            hour12: true,
            hour: 'numeric',
            minute: '2-digit'
        });
        headerTime.textContent = dateStr + ' • ' + timeStr;
        if (headerGreeting) headerGreeting.textContent = getGreeting();
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);
})();
