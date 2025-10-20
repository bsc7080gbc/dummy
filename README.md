# NebulaOS

NebulaOS is a lightweight, single-page browser desktop built with vanilla HTML, CSS, and JavaScript. It includes a draggable window manager, persistent notes, a faux terminal, and a small media gallery to showcase how an operating-system style workspace can be recreated for the web.

## Features
- **Window management** – open multiple app windows, drag them around, and focus with a click.
- **Persistent notes** – create, edit, and delete notes stored in `localStorage` so they remain after refreshes.
- **Productivity tools** – a task board for quick todos and a mini media gallery with interactive cards.
- **In-browser terminal** – run simple commands (`help`, `time`, `echo`, `clear`) with keyboard shortcuts.
- **Notifications** – actions like saving notes or completing tasks surface contextual toasts in the top bar.

## Development
1. Open `index.html` in a modern browser – no build tools required.
2. Edit styles in `styles.css` and behavior in `os.js`.
3. To reset persistent data (notes, tasks), clear the browser's local storage for the domain.


## Keyboard Shortcuts
- <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>N</kbd> – Open Notes
- <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd> – Open Terminal
- <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>M</kbd> – Open Media Gallery

## Project Structure
```
index.html   # Desktop markup shell
styles.css   # Theme, layout, and window styling
os.js        # Application logic and window manager
```
