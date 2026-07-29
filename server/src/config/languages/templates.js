/**
 * Dynamic starter file templates keyed by templateId.
 * Lessons may override with custom starterFiles; templates are defaults.
 */

const TEMPLATES = Object.freeze({
  html_css_js: {
    id: 'html_css_js',
    label: 'HTML / CSS / JavaScript',
    languageIds: ['html', 'css', 'javascript'],
    files: [
      {
        path: 'index.html',
        language: 'html',
        entry: true,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CodeCrafters Playground</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="app">
    <h1>Hello, CodeCrafters</h1>
    <p>Edit HTML, CSS, and JS — then Run to preview.</p>
    <button id="btn">Click me</button>
  </main>
  <script src="script.js"></script>
</body>
</html>
`,
      },
      {
        path: 'style.css',
        language: 'css',
        entry: false,
        content: `:root {
  color-scheme: dark;
  --bg: #0b1220;
  --card: #121a2b;
  --accent: #14b8a6;
  --text: #e2e8f0;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Segoe UI", system-ui, sans-serif;
  background: radial-gradient(circle at top, #132238, var(--bg));
  color: var(--text);
  display: grid;
  place-items: center;
}

.app {
  background: var(--card);
  border: 1px solid rgba(20, 184, 166, 0.25);
  border-radius: 16px;
  padding: 24px;
  width: min(420px, 92vw);
}

h1 { margin-top: 0; color: var(--accent); }

button {
  background: var(--accent);
  color: #042f2e;
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}
`,
      },
      {
        path: 'script.js',
        language: 'javascript',
        entry: false,
        content: `const btn = document.getElementById("btn");
let clicks = 0;

btn?.addEventListener("click", () => {
  clicks += 1;
  console.log("Button clicked", clicks, "times");
  btn.textContent = \`Clicked \${clicks}\`;
});

console.log("Workspace ready");
`,
      },
    ],
  },

  react_vite: {
    id: 'react_vite',
    label: 'React (Vite)',
    languageIds: ['react'],
    files: [
      {
        path: 'App.jsx',
        language: 'javascript',
        entry: true,
        content: `export default function App() {
  return (
    <main>
      <h1>React Playground</h1>
      <p>Starter template — execution arrives in a future prompt.</p>
    </main>
  );
}
`,
      },
      {
        path: 'main.jsx',
        language: 'javascript',
        entry: false,
        content: `import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);
`,
      },
      {
        path: 'index.css',
        language: 'css',
        entry: false,
        content: `body { font-family: system-ui, sans-serif; margin: 2rem; }
`,
      },
      {
        path: 'index.html',
        language: 'html',
        entry: false,
        content: `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>React</title></head>
  <body><div id="root"></div></body>
</html>
`,
      },
    ],
  },

  node_express: {
    id: 'node_express',
    label: 'Node + Express',
    languageIds: ['node', 'express'],
    files: [
      {
        path: 'server.js',
        language: 'javascript',
        entry: true,
        content: `const express = require("express");
const app = express();

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Hello from Express" });
});

app.listen(3000, () => console.log("Listening on 3000"));
`,
      },
      {
        path: 'package.json',
        language: 'json',
        entry: false,
        content: `{
  "name": "codecrafters-node-starter",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": { "express": "^4.19.0" }
}
`,
      },
    ],
  },

  mongodb_basics: {
    id: 'mongodb_basics',
    label: 'MongoDB Basics',
    languageIds: ['mongodb'],
    files: [
      {
        path: 'queries.js',
        language: 'javascript',
        entry: true,
        content: `// Placeholder — runs in isolated engine later
db.students.insertOne({ name: "Ahmad", course: "MERN" });
`,
      },
      {
        path: 'package.json',
        language: 'json',
        entry: false,
        content: `{ "name": "mongo-starter", "dependencies": { "mongodb": "^6.0.0" } }
`,
      },
    ],
  },

  tailwind_cdn: {
    id: 'tailwind_cdn',
    label: 'Tailwind CDN',
    languageIds: ['tailwind', 'html'],
    files: [
      {
        path: 'index.html',
        language: 'html',
        entry: true,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Tailwind</title>
</head>
<body class="min-h-screen bg-slate-900 text-white grid place-items-center">
  <h1 class="text-3xl font-bold text-teal-400">Tailwind Starter</h1>
</body>
</html>
`,
      },
      {
        path: 'input.css',
        language: 'css',
        entry: false,
        content: `/* Optional custom CSS */\n`,
      },
    ],
  },

  python_main: {
    id: 'python_main',
    label: 'Python',
    languageIds: ['python'],
    files: [
      {
        path: 'main.py',
        language: 'python',
        entry: true,
        content: `def main():
    print("Hello, CodeCrafters")

if __name__ == "__main__":
    main()
`,
      },
    ],
  },

  java_main: {
    id: 'java_main',
    label: 'Java',
    languageIds: ['java'],
    files: [
      {
        path: 'Main.java',
        language: 'java',
        entry: true,
        content: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, CodeCrafters");
  }
}
`,
      },
    ],
  },

  cpp_main: {
    id: 'cpp_main',
    label: 'C++',
    languageIds: ['cpp'],
    files: [
      {
        path: 'main.cpp',
        language: 'cpp',
        entry: true,
        content: `#include <iostream>
int main() {
  std::cout << "Hello, CodeCrafters" << std::endl;
  return 0;
}
`,
      },
    ],
  },

  php_index: {
    id: 'php_index',
    label: 'PHP',
    languageIds: ['php'],
    files: [
      {
        path: 'index.php',
        language: 'php',
        entry: true,
        content: `<?php
echo "Hello, CodeCrafters";
`,
      },
    ],
  },
})

function getTemplate(id) {
  return TEMPLATES[id] || null
}

function cloneTemplateFiles(id) {
  const tpl = getTemplate(id)
  if (!tpl) return null
  return tpl.files.map((f) => ({
    path: f.path,
    language: f.language,
    content: f.content,
    entry: Boolean(f.entry),
  }))
}

function listTemplates() {
  return Object.values(TEMPLATES).map(({ id, label, languageIds }) => ({
    id,
    label,
    languageIds,
  }))
}

module.exports = {
  TEMPLATES,
  getTemplate,
  cloneTemplateFiles,
  listTemplates,
}
