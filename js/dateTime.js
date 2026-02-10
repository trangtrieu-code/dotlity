(function () {

    // DOM refs
    const headerTime = document.getElementById('headerTime');

    // Default timezone is UTC
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    // Use system language for date/time format (e.g. vi-VN, en-US)
    const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';

    // if id isn't found, return to prevent page from breaking
    if (!headerTime) return;


    // update the time in the header
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
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // get Greeting depending on the time of day
    function getGreeting(timezone) {
        const formatter = new Intl.DateTimeFormat(locale, {
            timeZone: timezone,
            hour: 'numeric',
            hour12: false
        });
        const hour = parseInt(formatter.format(new Date()), 10);
        let base = 'Good Morning';
        if (hour >= 0 && hour < 6) base = 'Good night';
        else if (hour >= 12 && hour < 18) base = 'Good Afternoon';
        else if (hour >= 18) base = 'Good Evening';
        return base;
    }
})();