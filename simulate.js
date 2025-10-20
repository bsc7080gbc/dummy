import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { JSDOM } from "jsdom";
import { bootstrap } from "./os.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const htmlPath = resolve(__dirname, "index.html");
const html = readFileSync(htmlPath, "utf8");

const dom = new JSDOM(html, {
  url: "https://nebula.local/",
  pretendToBeVisual: true,
  resources: "usable",
  runScripts: "dangerously",
});

const { window } = dom;
const { document } = window;

const context = bootstrap(document);

const { manager } = context;
manager.openWindow("notes");
manager.openWindow("terminal");
manager.openWindow("gallery");

const windows = Array.from(document.querySelectorAll(".window"));
console.log("Active windows:");
windows.forEach((node, index) => {
  const title = node.querySelector(".window-title")?.textContent ?? "Untitled";
  console.log(`${index + 1}. ${title}`);
});

const notepadEditor = document.querySelector(".notepad-editor");
if (notepadEditor) {
  notepadEditor.value += "\nSimulated note entry.";
  notepadEditor.dispatchEvent(new window.Event("input", { bubbles: true }));
}

const terminalForm = document.querySelector(".terminal-form");
const terminalInput = document.querySelector(".terminal-input");
if (terminalForm && terminalInput) {
  const runCommand = (text) => {
    terminalInput.value = text;
    terminalForm.dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true })
    );
  };

  runCommand("pwd");
  runCommand("ls");
  runCommand("cat readme.txt");
}

const terminalOutput = document.querySelector(".terminal-output");
if (terminalOutput) {
  console.log("\nTerminal snapshot:\n");
  console.log(terminalOutput.textContent.trim());
}

const galleryCards = Array.from(document.querySelectorAll(".gallery-card footer"));
if (galleryCards.length) {
  console.log("\nGallery items:");
  galleryCards.forEach((footer, index) => {
    console.log(`${index + 1}. ${footer.textContent}`);
  });
}
