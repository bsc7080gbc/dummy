const STORAGE_KEYS = {
  notepad: "nebula_notepad",
  tasks: "nebula_tasks",
  filesystem: "nebula_filesystem",
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

function readJSON(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`Failed to read ${key} from storage`, error);
    return null;
  }
}

function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write ${key} to storage`, error);
  }
}

class ToastCenter {
  constructor(context) {
    this.doc = context.doc;
    this.win = context.win;
    this.toastTemplate = context.toastTemplate;
    this.notificationBadge = context.notificationBadge;
    this.stack = this.doc.createElement("div");
    this.stack.className = "toast-stack";
    this.doc.body.appendChild(this.stack);
  }

  show(message) {
    if (!this.toastTemplate) return;
    const toast = this.toastTemplate.content.firstElementChild.cloneNode(true);
    toast.textContent = message;
    this.stack.appendChild(toast);
    if (this.notificationBadge) {
      this.notificationBadge.textContent = message;
    }
    this.win.setTimeout(() => {
      toast.remove();
      if (!this.stack.children.length && this.notificationBadge) {
        this.notificationBadge.textContent = "No notifications";
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

class WindowManager {
  constructor(context, applications) {
    this.context = context;
    this.root = context.workspace;
    this.apps = applications;
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
    this.context.dockButtons.forEach((button) => {
    dockButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.openWindow(button.dataset.app);
      });
    });
  }

  registerShortcuts() {
    const doc = this.context.doc;
    doc.addEventListener("keydown", (event) => {
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
    if (!this.apps[appId]) {
      throw new Error(`Unknown app: ${appId}`);
    }

    if (this.windows.has(appId)) {
      const windowInstance = this.windows.get(appId);
      windowInstance.dataset.minimized = "false";
      this.bringToFront(windowInstance);
      return windowInstance;
    }

    const windowTemplate = this.context.windowTemplate;
    if (!windowTemplate) {
      throw new Error("Window template not found");
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

    const app = this.apps[appId];
    title.textContent = app.name;
    app.render(body, this);
    return windowEl;
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
    const doc = this.context.doc;
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
      if (event.pointerId !== undefined) {
        windowEl.setPointerCapture(event.pointerId);
      }
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
      if (event.pointerId !== undefined) {
        try {
          windowEl.releasePointerCapture(event.pointerId);
        } catch (error) {
          // ignore when capture not set
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

function createApplications(context) {
  return {
    notes: {
      name: "Notepad",
      render(container) {
        container.innerHTML = "";
        container.appendChild(createNotepad(context));
      },
    },
    tasks: {
      name: "Tasks",
      render(container) {
        container.innerHTML = "";
        const { element, refresh } = createTaskBoard(context);
        container.appendChild(element);
        refresh();
      },
    },
    terminal: {
      name: "Terminal",
      render(container) {
        container.innerHTML = "";
        container.appendChild(createTerminal(context));
      },
    },
    gallery: {
      name: "Media Gallery",
      render(container) {
        container.innerHTML = "";
        container.appendChild(createGallery(context));
      },
    },
  };
}

function createNotepad(context) {
  const { doc, win, storage, toastCenter } = context;
  const container = doc.createElement("div");
  container.className = "notepad";

  const toolbar = doc.createElement("div");
  toolbar.className = "notepad-toolbar";

  const title = doc.createElement("span");
  title.className = "notepad-heading";
  title.textContent = "Notepad";

  const status = doc.createElement("span");
  status.className = "notepad-status";

  const actions = doc.createElement("div");
  actions.className = "notepad-actions";

  const saveButton = doc.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save";

  const clearButton = doc.createElement("button");
  clearButton.type = "button";
  clearButton.textContent = "Clear";

  actions.append(saveButton, clearButton);
  toolbar.append(title, status, actions);

  const editor = doc.createElement("textarea");
  editor.className = "notepad-editor";
  editor.placeholder = "Start typing your notes...";

  const saved = readJSON(storage, STORAGE_KEYS.notepad);
  if (saved) {
    editor.value = saved.content || "";
    status.textContent = saved.updated
      ? `Saved ${formatTimestamp(saved.updated)}`
      : "Unsaved changes";
  } else {
    status.textContent = "Unsaved changes";
  }

  let saveTimeout;

  const persist = () => {
    if (saveTimeout) {
      win.clearTimeout(saveTimeout);
    }
    const payload = {
      content: editor.value,
      updated: new Date().toISOString(),
    };
    writeJSON(storage, STORAGE_KEYS.notepad, payload);
    status.textContent = `Saved ${formatTimestamp(payload.updated)}`;
  };

  const queueSave = () => {
    status.textContent = "Saving…";
    if (saveTimeout) {
      win.clearTimeout(saveTimeout);
    }
    saveTimeout = win.setTimeout(() => {
      persist();
    }, 400);
  };

  editor.addEventListener("input", queueSave);
  editor.addEventListener("blur", persist);

  saveButton.addEventListener("click", () => {
    persist();
    toastCenter.show("Notepad saved");
  });

  clearButton.addEventListener("click", () => {
    editor.value = "";
    persist();
    toastCenter.show("Notepad cleared");
  });

  container.append(toolbar, editor);

  win.setTimeout(() => {
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  });

  return container;
}

function formatTimestamp(isoString) {
  if (!isoString) return "just now";
  const date = new Date(isoString);
  return `at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function createTaskBoard(context) {
  const { doc, storage, toastCenter } = context;
  const element = doc.createElement("div");
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

  const header = doc.createElement("div");
  header.className = "task-add";
  const input = doc.createElement("input");
  input.type = "text";
  input.placeholder = "Add a task";

  const button = doc.createElement("button");
  button.textContent = "Add";
  button.addEventListener("click", () => {
    if (!input.value.trim()) return;
    const data = loadTasks(storage);
    data.active.push({ text: input.value.trim(), completed: false });
    saveTasks(storage, data);
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

  const columnWrapper = doc.createElement("div");
  const columnWrapper = document.createElement("div");
  columnWrapper.className = "task-columns";
  element.appendChild(columnWrapper);

  columns.forEach((column) => {
    const columnEl = doc.createElement("section");
    columnEl.className = "task-column";
    columnEl.dataset.column = column.id;

    const title = doc.createElement("h3");
    title.textContent = column.label;

    const list = doc.createElement("div");
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
    const data = loadTasks(storage);
    const data = loadTasks();
    columnWrapper.querySelectorAll(".task-list").forEach((list) => {
      list.innerHTML = "";
    });

    columns.forEach((column) => {
      const list = columnWrapper.querySelector(
        `.task-column[data-column="${column.id}"] .task-list`
      );
      data[column.id].forEach((task, index) => {
        const card = doc.createElement("div");
        const card = document.createElement("div");
        card.className = "task-card";
        if (task.completed) card.classList.add("completed");
        card.innerHTML = `<span>${task.text}</span>`;

        const action = doc.createElement("button");
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
          saveTasks(storage, data);
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

function loadTasks(storage) {
  const stored = readJSON(storage, STORAGE_KEYS.tasks) || {
    active: [],
    completed: [],
  };
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

function saveTasks(storage, data) {
  writeJSON(storage, STORAGE_KEYS.tasks, data);
}

function createTerminal(context) {
  const { doc, win, storage } = context;
  const container = doc.createElement("div");
  container.className = "terminal";

  const output = doc.createElement("div");
  output.className = "terminal-output";
  output.setAttribute("role", "log");
  output.setAttribute("aria-live", "polite");

  const form = doc.createElement("form");
  form.className = "terminal-form";

  const input = doc.createElement("input");
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

  const filesystem = new VirtualFileSystem(storage);
  const banner = "Nebula shell v0.3\nType `help` to list commands.";
  output.textContent = banner;

  const prompt = () => `nebula:${filesystem.promptPath()}$`;

  const appendOutput = (lines) => {
    output.textContent += `\n${lines.join("\n")}`;
    output.scrollTop = output.scrollHeight;
  };

  const commands = {
    help: () =>
      "Commands: help, ls [path], pwd, cd [path], cat <file>, mkdir <dir>, touch <file>, write <file> <text>, tree [path], clear, reset",
    ls: (args) => {
      const items = filesystem.ls(args[0]);
      return items.length ? items.join("  ") : "(empty)";
    },
    pwd: () => filesystem.pwd(),
    cd: (args) => filesystem.cd(args[0]),
    cat: (args) => filesystem.cat(args[0]),
    mkdir: (args) => filesystem.mkdir(args[0]),
    touch: (args) => filesystem.touch(args[0]),
    write: (args) => filesystem.write(args[0], args.slice(1).join(" ")), 
    tree: (args) => filesystem.tree(args[0]),
    clear: () => {
      output.textContent = banner;
      return "";
    },
    reset: () => filesystem.reset(),
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
    input.value = "";

    const [cmd, ...args] = value.split(/\s+/);
    const command = commands[cmd];

    let response;
    if (!command) {
      response = `Command not found: ${cmd}`;
    } else {
      try {
        response = command(args);
      } catch (error) {
        response = error.message;
      }
    }

    const lines = [`${prompt()} ${value}`];
    if (response) {
      lines.push(response);
    }

    appendOutput(lines);

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

  win.setTimeout(() => input.focus(), 50);

  form.appendChild(input);
  container.append(output, form);
  return container;
}

class VirtualFileSystem {
  constructor(storage) {
    this.storage = storage;
    const persisted = readJSON(storage, STORAGE_KEYS.filesystem);
    if (persisted?.root) {
      this.root = persisted.root;
      this.cwd = persisted.cwd || [];
    } else {
      this.root = this.createDefaultTree();
      this.cwd = ["home", "visitor"];
      this.persist();
    }
    this.home = ["home", "visitor"];
  }

  createDefaultTree() {
    return {
      type: "dir",
      children: {
        home: {
          type: "dir",
          children: {
            visitor: {
              type: "dir",
              children: {
                "readme.txt": {
                  type: "file",
                  content:
                    "Welcome to NebulaOS!\nUse `help` to explore the simulated filesystem.",
                },
                projects: {
                  type: "dir",
                  children: {
                    "nebula.txt": {
                      type: "file",
                      content: "NebulaOS v0.3 prototype running in browser mode.",
                    },
                  },
                },
              },
            },
          },
        },
        system: {
          type: "dir",
          children: {
            "motd.txt": {
              type: "file",
              content: "All systems nominal.",
            },
          },
        },
      },
    };
  }

  persist() {
    writeJSON(this.storage, STORAGE_KEYS.filesystem, {
      root: this.root,
      cwd: this.cwd,
    });
  }

  promptPath() {
    return this.cwd.length ? `/${this.cwd.join("/")}` : "/";
  }

  pwd() {
    return this.promptPath();
  }

  normalizePath(path = "") {
    if (!path) {
      return [...this.cwd];
    }
    const isAbsolute = path.startsWith("/");
    const segments = isAbsolute ? [] : [...this.cwd];
    path.split("/").forEach((segment) => {
      if (!segment || segment === ".") return;
      if (segment === "..") {
        segments.pop();
      } else {
        segments.push(segment);
      }
    });
    return segments;
  }

  getNode(segments) {
    let current = this.root;
    for (const segment of segments) {
      if (current.type !== "dir") return null;
      current = current.children?.[segment];
      if (!current) return null;
    }
    return current;
  }

  ensureDirectory(node) {
    if (!node) {
      throw new Error("Parent directory does not exist");
    }
    if (node.type !== "dir") {
      throw new Error("Not a directory");
    }
  }

  ls(path) {
    const targetSegments = this.normalizePath(path || ".");
    const node = this.getNode(targetSegments);
    if (!node) throw new Error("Path not found");
    if (node.type === "file") {
      return [targetSegments[targetSegments.length - 1] || "/"];
    }
    return Object.keys(node.children)
      .sort()
      .map((name) =>
        node.children[name].type === "dir" ? `${name}/` : name
      );
  }

  cd(path) {
    const target = path ? this.normalizePath(path) : [...this.home];
    const node = this.getNode(target);
    if (!node) throw new Error("Directory not found");
    if (node.type !== "dir") throw new Error("Not a directory");
    this.cwd = target;
    this.persist();
    return this.pwd();
  }

  splitPath(path) {
    const segments = this.normalizePath(path);
    if (!segments.length) throw new Error("Cannot use root for this operation");
    const name = segments.pop();
    return { parentSegments: segments, name };
  }

  mkdir(path) {
    if (!path) throw new Error("Usage: mkdir <dir>");
    const { parentSegments, name } = this.splitPath(path);
    const parent = this.getNode(parentSegments);
    this.ensureDirectory(parent);
    if (parent.children[name]) throw new Error("Path already exists");
    parent.children[name] = { type: "dir", children: {} };
    this.persist();
    return `Created directory ${name}`;
  }

  touch(path) {
    if (!path) throw new Error("Usage: touch <file>");
    const { parentSegments, name } = this.splitPath(path);
    const parent = this.getNode(parentSegments);
    this.ensureDirectory(parent);
    if (parent.children[name] && parent.children[name].type !== "file") {
      throw new Error("Cannot overwrite directory");
    }
    parent.children[name] = parent.children[name] || {
      type: "file",
      content: "",
    };
    this.persist();
    return `Touched ${name}`;
  }

  write(path, content) {
    if (!path || !content) {
      throw new Error("Usage: write <file> <text>");
    }
    const { parentSegments, name } = this.splitPath(path);
    const parent = this.getNode(parentSegments);
    this.ensureDirectory(parent);
    if (parent.children[name] && parent.children[name].type !== "file") {
      throw new Error("Cannot overwrite directory");
    }
    parent.children[name] = {
      type: "file",
      content,
    };
    this.persist();
    return `Wrote to ${name}`;
  }

  cat(path) {
    if (!path) throw new Error("Usage: cat <file>");
    const segments = this.normalizePath(path);
    const node = this.getNode(segments);
    if (!node) throw new Error("File not found");
    if (node.type !== "file") throw new Error("Not a file");
    return node.content || "";
  }

  tree(path) {
    const segments = this.normalizePath(path || ".");
    const node = this.getNode(segments);
    if (!node) throw new Error("Path not found");

    const lines = [];
    const label = segments.length ? segments[segments.length - 1] : "/";
    const suffix = node.type === "dir" && label !== "/" ? "/" : "";
    lines.push(`${label}${suffix}`);

    const walk = (current, depth) => {
      if (current.type !== "dir") return;
      const indent = "  ".repeat(depth);
      Object.keys(current.children)
        .sort()
        .forEach((name) => {
          const child = current.children[name];
          lines.push(`${indent}${name}${child.type === "dir" ? "/" : ""}`);
          walk(child, depth + 1);
        });
    };

    walk(node, 1);
    return lines.join("\n");
  }

  reset() {
    this.root = this.createDefaultTree();
    this.cwd = [...this.home];
    this.persist();
    return "Filesystem reset";
  }
}

function createGallery(context) {
  const { doc } = context;
  const gallery = doc.createElement("div");
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
    const card = doc.createElement("article");
    card.className = "gallery-card";
    const image = doc.createElement("img");
    image.src = item.src;
    image.alt = item.title;

    const footer = doc.createElement("footer");
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

function tickClock(context) {
  if (!context.clockBadge) return;
  const now = new Date();
  context.clockBadge.textContent = now.toLocaleTimeString([], {
function tickClock() {
  const now = new Date();
  clockBadge.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveStorage(win) {
  if (win) {
    try {
      const storage = win.localStorage;
      if (storage) {
        return storage;
      }
    } catch (error) {
      console.warn("Falling back to in-memory storage", error);
    }
  }
  return createMemoryStorage();
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

export function bootstrap(doc = typeof document !== "undefined" ? document : null) {
  if (!doc) {
    throw new Error("A document is required to bootstrap NebulaOS.");
  }

  const win = doc.defaultView || globalThis;
  const workspace = doc.getElementById("workspace");
  if (!workspace) {
    throw new Error("NebulaOS workspace element not found.");
  }

  const windowTemplate = doc.getElementById("window-template");
  const toastTemplate = doc.getElementById("toast-template");
  const dockButtons = Array.from(doc.querySelectorAll(".dock-item"));
  const notificationBadge = doc.getElementById("status-notification");
  const clockBadge = doc.getElementById("status-clock");
  const storage = resolveStorage(win);

  const context = {
    doc,
    win,
    workspace,
    windowTemplate,
    toastTemplate,
    dockButtons,
    notificationBadge,
    clockBadge,
    storage,
  };

  context.toastCenter = new ToastCenter(context);
  context.applications = createApplications(context);
  context.manager = new WindowManager(context, context.applications);

  tickClock(context);
  context.clockInterval = win.setInterval(() => tickClock(context), 1000);

  const savedNotepad = readJSON(storage, STORAGE_KEYS.notepad);
  if (savedNotepad?.updated && notificationBadge) {
    notificationBadge.textContent = "Notepad restored";
  }

  return context;
}

if (typeof window !== "undefined" && window.document) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bootstrap(document));
  } else {
    bootstrap(document);
  }
setInterval(tickClock, 1000);
tickClock();

const manager = new WindowManager(workspace);

// preload notes to display count in dock interactions
if (JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || "[]").length) {
  notificationBadge.textContent = "Welcome back";
}
