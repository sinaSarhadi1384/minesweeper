# 💣 Minesweeper - مین‌سویپر

A classic Minesweeper game built with vanilla **HTML**, **CSS**, and **JavaScript**. Features a modern dark UI, full RTL Persian layout, multiple difficulty levels, custom game settings, keyboard navigation, and touch support.

---

## ✨ Features

- 🎮 **Three classic difficulty levels** + a fully customizable mode
- 🖱️ **Mouse, keyboard, and touch** controls
- 🚩 **Right-click / long-press** to flag suspected mines
- ⏱️ **Live timer** and mine counter
- 🎯 **Chord reveal** (Shift+Click or both mouse buttons) for fast play
- 🌐 **Full Persian (Farsi) RTL** interface
- 🎨 **Modern dark theme** with smooth animations
- ♿ **Accessible** — keyboard navigable, ARIA labels, reduced-motion support
- 📱 **Responsive** — works on desktop, tablet, and mobile

---

## 🎯 Difficulty Levels

| Level | Rows | Cols | Mines |
|---|---|---|---|
| مبتدی (Beginner) | 9 | 9 | 10 |
| متوسط (Intermediate) | 16 | 16 | 40 |
| حرفه‌ای (Expert) | 16 | 30 | 99 |
| سفارشی (Custom) | 8–30 | 8–30 | 10–(rows × cols − 9) |

The **first click is always safe** — mines are placed only after the first reveal, and the clicked cell plus its 8 neighbors are guaranteed to be mine-free.

---

## 🕹️ Controls

### Mouse
- **Left Click** — Reveal a cell
- **Right Click** — Place / remove a flag
- **Shift + Left Click** — Chord reveal (reveal all unflagged neighbors of a numbered cell if the flag count matches)

### Keyboard (focus the board first)
| Key | Action |
|---|---|
| `←` / `→` / `↑` / `↓` | Move focus (mapped for RTL) |
| `Enter` or `Space` | Reveal cell |
| `F` | Toggle flag |
| `C` | Chord reveal |

### Touch
- **Tap** — Reveal a cell
- **Long press (~400ms)** — Place / remove a flag (with vibration feedback on supported devices)

---

## 🚀 Getting Started

This is a **zero-dependency** static site. No build step, no package manager.

### Run locally

Just open [index.html](index.html) in any modern browser:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Or serve it with any static file server:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8000`.

---

## 📁 Project Structure

```
MineSweeper/
├── index.html      # Markup, layout, modals, RTL setup
├── style.css       # Dark theme, responsive design, animations
├── game.js         # Game logic, state, board generation, controls
└── README.md       # This file
```

---

## 🧠 How the Game Works

- **Board generation** — A 2D grid of cell objects stores `isMine`, `isRevealed`, `isFlagged`, and `neighborMines`.
- **Mine placement** — After the first click, mines are randomly placed (Fisher–Yates shuffle) while excluding the clicked cell and its neighbors.
- **Number calculation** — Each non-mine cell is given a count of adjacent mines.
- **Auto-reveal** — Clicking a cell with `0` neighbor mines recursively reveals its connected empty region.
- **Win condition** — All non-mine cells are revealed.
- **Lose condition** — A mine is revealed; all remaining mines are shown and any wrong flags are marked.

### Debug API

Open the browser console and use:

```js
minesweeper.newGame('expert');   // Start a new game at the given difficulty
minesweeper.getState();          // Inspect the current game state
minesweeper.DIFFICULTIES;        // View all difficulty presets
```

---

## 🛠️ Tech Stack

- **HTML5** — Semantic markup, native `<dialog>` elements for modals
- **CSS3** — Custom properties (CSS variables), Grid layout, animations, media queries
- **Vanilla JavaScript (ES6+)** — IIFE module pattern, no frameworks
- **Fonts** — [Vazirmatn](https://fonts.google.com/specimen/Vazirmatn) (UI) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (numerals) via Google Fonts

---

## 🌐 Browser Support

Tested in modern evergreen browsers (Chrome, Firefox, Edge, Safari). Uses:

- CSS Grid
- `aspect-ratio`
- Native `<dialog>` element
- `prefers-reduced-motion` / `prefers-contrast` media queries
- `navigator.vibrate` (graceful fallback)

---

## 📜 License

This project is provided as-is for personal and educational use. Feel free to fork and adapt.
