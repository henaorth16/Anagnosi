# Anágnosi – Premium DocX Reader & Browser Extension

**Anágnosi** (ανάγνωση – Greek for *reading*) is a premium, lightweight, distraction-free Microsoft Word (.docx) document viewer built to run seamlessly on the web and as a browser extension. It renders documents directly in your browser with gorgeous customizable themes, advanced typography controls, interactive full-text search, and automated local file interception.

---

## ✨ Features
- 🚀 **Auto-Sniffing & Redirection:** Automatically intercepts navigations to any `.docx` file (either a web link or local file) and opens it instantly within Anágnosi.
- 🎨 **Beautiful Reading Themes:** Toggle between Light, Sepia, Dark, and high-contrast OLED black modes.
- ✍️ **Advanced Typography Controls:** Instantly customize serif/sans/mono font families, precise text sizing (14px–26px), line heights, and margins to fit your reading style.
- 📂 **Flexible Drag & Drop:** Drag any `.docx` file from your desktop and drop it directly onto the page to load it instantly.
- 📑 **Interactive Document Outline:** Automatically extracts document headers to build a scroll-linked table of contents (TOC) for fast section navigation.
- 🔍 **Full-Text Highlight Search:** Robust real-time search with visual highlights, match counters, and quick navigation keys (`Ctrl+F` / `Cmd+F` and `Enter`).
- 📊 **Reading Analytics:** Dynamic word count tracking and estimated reading time.
- 💾 **HTML Export:** Export beautifully structured HTML renders directly to your local drive.

---

## 🛠️ Build Instructions
Before loading the extension, compile the TypeScript source files and pack the web application.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Steps
1. Navigate to the project root directory in your terminal.
2. Install the project dependencies:
   ```bash
   npm install
   ```
3. Compile and build the extension package:
   ```bash
   npm run build
   ```
   *This produces two browser-specific bundles:*
   - **`dist/chrome/`** — Chrome / Chromium (MV3 `service_worker` background)
   - **`dist/firefox/`** — Firefox (MV3 `scripts` background)

   Build a single target with `npm run build:chrome` or `npm run build:firefox`.

### Web app (Vercel)
Deploy only the web reader — not the browser extension bundles:

```bash
npm run build:web
```

This outputs a standard Vite SPA to **`dist/`**. Vercel uses `vercel.json` to run this command automatically and serve `index.html` for client-side routes.

---

## 📥 How to Install & Load the Extension

### 🌐 Google Chrome (and Chromium-based browsers)
1. Open Google Chrome.
2. Navigate to the extensions manager by typing **`chrome://extensions/`** in the URL bar.
3. Turn on the **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the **`dist/chrome/`** folder inside this project's root directory.
6. The extension is now loaded! Pin **Anágnosi** to your extension bar and click it to open the reader.

#### 📂 Allowing Local `.docx` File Sniffing
To let Anágnosi capture local `.docx` files when you drag them into Chrome or double-click them:
1. On the `chrome://extensions/` page, click **Details** under the Anágnosi extension card.
2. Scroll down to find the **Allow access to file URLs** setting.
3. Toggle it **ON**.
4. Now, any local `.docx` file opened in Chrome will automatically open in Anágnosi!

---

### 🦊 Mozilla Firefox

1. Open Firefox.
2. In the URL bar, go to **`about:debugging#/runtime/this-firefox`**.
3. Click the **Load Temporary Add-on...** button.
4. Open the **`dist/firefox/`** folder of this project and select the **`manifest.json`** file.
5. anagnosi will load immediately! You can access it by clicking the extension icon in the toolbar.

#### 📂 Opening Local `.docx` Files
Firefox does not offer Chrome’s “Allow access to file URLs” option. When you open a local `.docx` from the filesystem, Anágnosi redirects to the reader and prompts you to **drag and drop** the file or use **Open File** / **Choose file…** on the landing screen.

---

## 💻 Local Development Setup
To run the project locally with hot reloading (HMR) for fast UI testing:
```bash
npm run dev
```
Vite and CRXJS will watch your files and compile them live. Use `npm run dev:chrome` or `npm run dev:firefox` for a browser-specific dev build (`dist/chrome/` or `dist/firefox/`).

---

## 🏛️ License
Built with ❤️ under standard personal licensing terms. Enjoy a beautiful reading experience!
