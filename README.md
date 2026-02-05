# Dotlity

A personal productivity workspace inspired by [Zenscape](https://zenscape.tsuchiya-dev.com/). Combines multiple productivity tools into a single, beautiful interface.

## ✨ Features

### 🎯 **Pomodoro Timer**
- Configurable focus sessions (25 min), short breaks (10 min), and long breaks (30 min)
- Long break after every 3 completed focus sessions
- Session history with Today/Week/Month/Total statistics
- Visual progress bar and confirmation popups
- Settings to customize durations

### ✅ **Todo List**
- Add, edit, delete, and complete tasks
- Persistent storage

### 📝 **Notes**
- Rich text note-taking with auto-save
- Multiple notes support

### 🎵 **Music Player**
- Lo-fi music collection (Morning, Afternoon, Evening)
- Play, pause, skip, and volume controls

### 🌊 **Ambient Sounds**
- Background noise generator (waves, fire, etc.)
- Volume control

### ⏰ **Time & Weather**
- Real-time clock and weather display in header

### 🎨 **Customization**
- Light & Dark theme toggle
- Custom background images
- Personalized greeting
- All preferences saved locally

## 🚀 Getting Started

### Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd dotlity
   ```

2. **Open directly in browser**
   - Open `index.html` in your web browser

3. **Or use a local server**
   ```bash
   npm install
   npm start
   ```
   Available at `http://localhost:3001`

## 📖 Usage

- **Pomodoro**: Click Timer icon → Play to start → View History for stats
- **Todo**: Click Checklist icon → Add tasks → Mark complete
- **Notes**: Click Notes icon → Type and auto-save
- **Music**: Click Music icon → Select album → Play tracks
- **Ambient**: Click Ambient icon → Select sound → Adjust volume
- **Settings**: Click gear icon → Customize theme, background, name

## 📁 Project Structure

```
dotlity/
├── index.html          # Main HTML file
├── styles.css          # Global styles
├── js/
│   ├── app.js          # Widget management, settings
│   ├── pomodoro.js     # Pomodoro timer
│   ├── todo.js         # Todo list
│   ├── notes.js         # Notes editor
│   ├── music.js         # Music player
│   ├── ambient.js       # Ambient sounds
│   └── time-weather.js  # Time and weather
└── assets/music/        # Music files
```

## 🛠️ Tech Stack

- **HTML5, CSS3, JavaScript (ES6+)**
- **Tailwind CSS** (via CDN)
- **Material Symbols** icons
- **localStorage** for data persistence

## 📝 Notes

- All data stored locally in browser's localStorage
- No backend server required
- Works offline (except weather data)

## 🙏 Credits

- Inspired by [Zenscape](https://zenscape.tsuchiya-dev.com/)
- Icons: [Material Symbols](https://fonts.google.com/icons)
- Fonts: [Inter](https://rsms.me/inter/) and [Outfit](https://fonts.google.com/specimen/Outfit)

---

**Enjoy your productive workspace! 🚀**
