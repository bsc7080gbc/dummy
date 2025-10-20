const workspace = document.getElementById("workspace");
const windowTemplate = document.getElementById("window-template");
const noteTemplate = document.getElementById("note-template");
const toastTemplate = document.getElementById("toast-template");
const dockButtons = document.querySelectorAll(".dock-item");
const notificationBadge = document.getElementById("status-notification");
const clockBadge = document.getElementById("status-clock");

const STORAGE_KEYS = {
  notes: "nebula_notes",
  tasks: "nebula_tasks",
};

const shortcuts = {
  notes: { key: "n", combo: ["Control", "Alt"] },
  terminal: { key: "t", combo: ["Control", "Alt"] },
  gallery: { key: "m", combo: ["Control", "Alt"] },
};

class ToastCenter {
  constructor() {
    this.stack = document.createElement("div");
    this.stack.className = "toast-stack";
    document.body.appendChild(this.stack);
  }

  show(message) {
    const toast = toastTemplate.content.firstElementChild.cloneNode(true);
    toast.textContent = message;
    this.stack.appendChild(toast);
    notificationBadge.textContent = message;
    setTimeout(() => {
      toast.remove();
      if (!this.stack.children.length) {
        notificationBadge.textContent = "No notifications";
      }
    }, 3200);
  }
}

const toastCenter = new ToastCenter();

class WindowManager {
  constructor(root) {
    this.root = root;
    this.windows = new Map();
    this.zIndex = 1;
    this.registerDock();
    this.registerShortcuts();
  }

  registerDock() {
    dockButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.openWindow(button.dataset.app);
      });
    });
  }

  registerShortcuts() {
    document.addEventListener("keydown", (event) => {
      const activeShortcut = Object.entries(shortcuts).find(([, config]) => {
        return (
          config.key === event.key.toLowerCase() &&
          config.combo.every((modifier) => event.getModifierState(modifier))
        );
      });

      if (activeShortcut) {
        event.preventDefault();
        this.openWindow(activeShortcut[0]);
      }
    });
  }

  openWindow(appId) {
    if (this.windows.has(appId)) {
      const windowInstance = this.windows.get(appId);
      windowInstance.dataset.minimized = "false";
      this.bringToFront(windowInstance);
      return;
    }

    const windowEl = windowTemplate.content.firstElementChild.cloneNode(true);
    windowEl.dataset.app = appId;
    windowEl.tabIndex = -1;
    windowEl.dataset.minimized = "false";
    windowEl.style.top = `${70 + this.windows.size * 24}px`;
    windowEl.style.left = `${80 + this.windows.size * 24}px`;
    this.root.appendChild(windowEl);
    this.windows.set(appId, windowEl);

    this.bringToFront(windowEl);
    this.attachWindowEvents(windowEl);

    const body = windowEl.querySelector(".window-body");
    const title = windowEl.querySelector(".window-title");

    const app = applications[appId];
    const { name, render } = app;
    title.textContent = name;
    render(body, this);
  }

  closeWindow(appId) {
    const windowEl = this.windows.get(appId);
    if (!windowEl) return;
    windowEl.remove();
    this.windows.delete(appId);
  }

  bringToFront(windowEl) {
    this.zIndex += 1;
    windowEl.style.zIndex = this.zIndex;
    windowEl.focus({ preventScroll: true });
  }

  attachWindowEvents(windowEl) {
    const header = windowEl.querySelector(".window-header");
    const closeButton = windowEl.querySelector('[data-action="close"]');
    const minimizeButton = windowEl.querySelector('[data-action="minimize"]');
    const appId = windowEl.dataset.app;

    const pointerState = { dragging: false, offsetX: 0, offsetY: 0 };

    const startDrag = (event) => {
      pointerState.dragging = true;
      const rect = windowEl.getBoundingClientRect();
      pointerState.offsetX = event.clientX - rect.left;
      pointerState.offsetY = event.clientY - rect.top;
      windowEl.setPointerCapture(event.pointerId);
      this.bringToFront(windowEl);
    };

    const moveDrag = (event) => {
      if (!pointerState.dragging) return;
      const x = event.clientX - pointerState.offsetX;
      const y = event.clientY - pointerState.offsetY;
      windowEl.style.left = `${Math.max(16, x)}px`;
      windowEl.style.top = `${Math.max(60, y)}px`;
    };

    const endDrag = (event) => {
      pointerState.dragging = false;
      if (event.pointerId) {
        try {
          windowEl.releasePointerCapture(event.pointerId);
        } catch (error) {
          // noop when capture was not set
        }
      }
    };

    header.addEventListener("pointerdown", startDrag);
    header.addEventListener("pointermove", moveDrag);
    header.addEventListener("pointerup", endDrag);
    header.addEventListener("pointercancel", endDrag);

    windowEl.addEventListener("mousedown", () => this.bringToFront(windowEl));

    closeButton.addEventListener("click", () => this.closeWindow(appId));
    minimizeButton.addEventListener("click", () => {
      const minimized = windowEl.dataset.minimized === "true";
      windowEl.dataset.minimized = minimized ? "false" : "true";
    });
  }
}

const applications = {
  notes: {
    name: "Notes",
    render(container) {
      container.innerHTML = "";
      container.appendChild(buildNotesToolbar());
      const list = document.createElement("div");
      list.className = "note-list";
      container.appendChild(list);
      loadNotes(list);
    },
  },
  tasks: {
    name: "Tasks",
    render(container) {
      container.innerHTML = "";
      const { element, refresh } = createTaskBoard();
      container.appendChild(element);
      refresh();
    },
  },
  terminal: {
    name: "Terminal",
    render(container) {
      container.innerHTML = "";
      container.appendChild(createTerminal());
    },
  },
  gallery: {
    name: "Media Gallery",
    render(container) {
      container.innerHTML = "";
      container.appendChild(createGallery());
    },
  },
};
function buildNotesToolbar() {
  const toolbar = document.createElement("div");
  toolbar.className = "note-toolbar";

  const count = document.createElement("span");
  count.id = "note-count";
  count.textContent = "0 notes";

  const addButton = document.createElement("button");
  addButton.textContent = "New note";
  addButton.className = "note-add";
  addButton.addEventListener("click", () => {
    const list = document.querySelector(".note-list");
    const note = createNote();
    list.prepend(note.element);
    note.title.focus();
    persistNotes();
    toastCenter.show("Created a note");
    updateNoteCount();
  });

  toolbar.append(count, addButton);
  return toolbar;
}

function createNote(data = {}) {
  const clone = noteTemplate.content.firstElementChild.cloneNode(true);
  const title = clone.querySelector(".note-title");
  const body = clone.querySelector(".note-body");
  const updated = clone.querySelector(".note-updated");
  const removeButton = clone.querySelector(".note-delete");

  title.value = data.title ?? "";
  body.value = data.body ?? "";
  if (data.updated) {
    updated.textContent = `Edited ${new Date(data.updated).toLocaleString()}`;
    updated.dateTime = data.updated;
  } else {
    updated.textContent = "Just now";
    updated.dateTime = new Date().toISOString();
  }

  const save = () => {
    updated.textContent = `Edited ${new Date().toLocaleString()}`;
    updated.dateTime = new Date().toISOString();
    persistNotes();
  };

  title.addEventListener("input", save);
  body.addEventListener("input", save);

  removeButton.addEventListener("click", () => {
    clone.remove();
    persistNotes();
    updateNoteCount();
    toastCenter.show("Deleted a note");
  });

  return { element: clone, title, body };
}

function loadNotes(listContainer) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || "[]");
  saved.forEach((item) => {
    const note = createNote(item);
    listContainer.appendChild(note.element);
  });
  updateNoteCount();
}

function updateNoteCount() {
  const count = document.getElementById("note-count");
  if (!count) return;
  const notes = document.querySelectorAll(".note-card");
  count.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;
}

function persistNotes() {
  const notes = [...document.querySelectorAll(".note-card")].map((card) => ({
    title: card.querySelector(".note-title").value,
    body: card.querySelector(".note-body").value,
    updated: card.querySelector(".note-updated").dateTime,
  }));
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
}

function createTaskBoard() {
  const element = document.createElement("div");
  element.className = "task-board";

  const columns = [
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
  ];

  const header = document.createElement("div");
  header.className = "task-add";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Add a task";

  const button = document.createElement("button");
  button.textContent = "Add";
  button.addEventListener("click", () => {
    if (!input.value.trim()) return;
    const data = loadTasks();
    data.active.push({ text: input.value.trim(), completed: false });
    saveTasks(data);
    input.value = "";
    refresh();
    toastCenter.show("Task added");
  });

  header.append(input, button);
  element.appendChild(header);

  const columnWrapper = document.createElement("div");
  columnWrapper.className = "task-columns";
  element.appendChild(columnWrapper);

  columns.forEach((column) => {
    const columnEl = document.createElement("section");
    columnEl.className = "task-column";
    columnEl.dataset.column = column.id;

    const title = document.createElement("h3");
    title.textContent = column.label;

    const list = document.createElement("div");
    list.className = "task-list";

    columnEl.append(title, list);
    columnWrapper.appendChild(columnEl);
  });

  const refresh = () => {
    const data = loadTasks();
    columnWrapper.querySelectorAll(".task-list").forEach((list) => {
      list.innerHTML = "";
    });

    columns.forEach((column) => {
      const list = columnWrapper.querySelector(
        `.task-column[data-column="${column.id}"] .task-list`
      );
      data[column.id].forEach((task, index) => {
        const card = document.createElement("div");
        card.className = "task-card";
        if (task.completed) card.classList.add("completed");
        card.innerHTML = `<span>${task.text}</span>`;

        const action = document.createElement("button");
        action.textContent = column.id === "completed" ? "Undo" : "Complete";
        action.addEventListener("click", () => {
          if (column.id === "completed") {
            task.completed = false;
            data.completed.splice(index, 1);
            data.active.push(task);
            toastCenter.show("Task moved to active");
          } else {
            task.completed = true;
            data.active.splice(index, 1);
            data.completed.push(task);
            toastCenter.show("Task completed");
          }
          saveTasks(data);
          refresh();
        });

        card.appendChild(action);
        list.appendChild(card);
      });
    });
  };

  return { element, refresh };
}

function loadTasks() {
  const stored = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.tasks) ||
      JSON.stringify({ active: [], completed: [] })
  );

  return {
    active: stored.active || stored.todo || [],
    completed: stored.completed || stored.done || [],
  };
}

function saveTasks(data) {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(data));
}

function createTerminal() {
  const container = document.createElement("div");
  container.className = "terminal";

  const output = document.createElement("div");
  output.className = "terminal-output";
  output.setAttribute("role", "log");
  output.setAttribute("aria-live", "polite");
  output.textContent = "Nebula shell v0.2\nType `help` to list commands.";

  const form = document.createElement("form");
  form.className = "terminal-form";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "terminal-input";
  input.setAttribute("aria-label", "Terminal input");
  input.autocomplete = "off";

  const history = [];
  let historyIndex = -1;
  const commands = {
    help: () => "Commands: help, time, echo <text>, clear",
    time: () => new Date().toLocaleString(),
    echo: (args) => args.join(" ") || "",
    clear: () => {
      output.textContent = "";
      return "";
    },
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    history.unshift(value);
    historyIndex = -1;

    const [cmd, ...args] = value.split(" ");
    const command = commands[cmd];

    const response = command ? command(args) : `Command not found: ${cmd}`;
    if (cmd === "clear") {
      output.textContent = "Nebula shell v0.2\nType `help` to list commands.";
    } else {
      output.textContent += `\n> ${value}\n${response}`;
    }

    input.value = "";
    output.scrollTop = output.scrollHeight;
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      historyIndex = Math.min(historyIndex + 1, history.length - 1);
      input.value = history[historyIndex] || "";
      event.preventDefault();
    }
    if (event.key === "ArrowDown") {
      historyIndex = Math.max(historyIndex - 1, -1);
      input.value = historyIndex === -1 ? "" : history[historyIndex];
      event.preventDefault();
    }
  });

  form.appendChild(input);
  container.append(output, form);
  return container;
}

function createGallery() {
  const gallery = document.createElement("div");
  gallery.className = "gallery-grid";

  const items = [
    {
      title: "Andromeda nebula",
      src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Circuit city",
      src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Ocean horizon",
      src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Aurora sky",
      src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
  ];

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "gallery-card";
    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.title;

    const footer = document.createElement("footer");
    footer.textContent = item.title;

    card.append(image, footer);
    gallery.appendChild(card);
  });

  return gallery;
}

function tickClock() {
  const now = new Date();
  clockBadge.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

setInterval(tickClock, 1000);
tickClock();

const manager = new WindowManager(workspace);

// preload notes to display count in dock interactions
if (JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || "[]").length) {
  notificationBadge.textContent = "Welcome back";
}
