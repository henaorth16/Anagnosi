# Anágnosi – Document Reader

A browser extension and web app that lets you open and read **Word, Excel, PowerPoint, and RTF files** directly inside your browser — no upload, no server, no third-party service. Everything is parsed and rendered locally on your device.

---

## Supported Formats

| Format               | Extension | Notes                                                                                        |
| -------------------- | --------- | -------------------------------------------------------------------------------------------- |
| Microsoft Word       | `.docx`   | Full text, headings, tables, images via [Mammoth](https://github.com/mwilliamson/mammoth.js) |
| Microsoft Excel      | `.xlsx`   | All worksheets rendered as scrollable tables via [SheetJS](https://sheetjs.com/)             |
| Microsoft PowerPoint | `.pptx`   | Each slide rendered as a card — titles, body text, speaker notes                             |
| Rich Text Format     | `.rtf`    | Bold, italic, underline, paragraphs, tables, hyperlinks, Unicode                             |

---

## Features

- **Drag & drop or click to open** any supported file from your file system or a URL
- **Auto-intercept navigation** — clicking a document link in your browser opens it in the reader instead of downloading
- **Zero upload** — all parsing runs in your browser; your files never leave your device
- **Lazy-loaded parsers** — each format's library is only downloaded when you actually open a file of that type, keeping the initial load fast
- **Document outline** — headings are extracted and shown as a clickable TOC in the sidebar
- **Full-text search** — Ctrl/Cmd+F opens an in-page search with previous/next navigation
- **Reading stats** — word count and estimated reading time shown per document
- **Four themes** — Light, Sepia, Dark, OLED
- **Typography controls** — serif / sans / mono fonts, font size slider, line spacing, page width
- **Export parsed HTML** — download the rendered content as a standalone `.html` file

---

## Browser Support

| Browser               | Extension | Web app |
| --------------------- | --------- | ------- |
| Chrome / Edge / Brave | ✅        | ✅      |
| Firefox               | ✅        | ✅      |

Local file interception (opening `file://` paths) requires enabling **Allow access to file URLs** in Chrome's extension settings. Firefox shows a prompt to pick the file manually when navigating to a local file.

---

## Installation (Extension)

### Chrome / Edge / Brave

1. Build the Chrome extension:
   ```bash
   npm install
   npm run build:chrome
   ```
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/chrome` folder.
4. To open local `.docx` / `.xlsx` / `.pptx` / `.rtf` files from disk, go to the extension's **Details** and enable **Allow access to file URLs**.

### Firefox

1. Build the Firefox extension:
   ```bash
   npm install
   npm run build:firefox
   ```
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select any file inside `dist/firefox`.

---

## Usage

### Opening a file

**From the extension toolbar icon** — click the Anágnosi icon in your browser toolbar to open the reader in a new tab, then drag a file onto the drop zone or click **Open File**.

**Via URL interception** — navigate to any `.docx`, `.xlsx`, `.pptx`, or `.rtf` URL (including `file://` paths) and the extension will redirect the tab to the reader automatically.

**Web app (no extension)** — visit the deployed Vercel URL and drag or pick a file. Local file interception is not available without the extension.

### Searching

- Press **Ctrl+F** (Windows/Linux) or **Cmd+F** (macOS) to open the search bar.
- Type to highlight all matches; use the arrow buttons or Enter / Shift+Enter to navigate between them.
- Press **Esc** to close search.

### Sidebar

The sidebar has two tabs:

- **Document Outline** — click any heading to jump to that section; shows live word count and estimated reading time.
- **Reader Settings** — change theme, font family, font size, line spacing, and page width. All preferences are saved to `localStorage`.

### Exporting

Click **Export Parsed HTML** in the Settings tab to download the rendered document content as a self-contained `.html` file.

---

## Development

```bash
# Install dependencies (includes xlsx, mammoth, jszip, webextension-polyfill)
npm install

# Start Vite dev server (web app only)
npm run dev

# Build Chrome extension  →  dist/chrome/
npm run build:chrome

# Build Firefox extension →  dist/firefox/
npm run build:firefox

# Build web app (Vercel)  →  dist/
npm run build:web
```

### Project Structure

```
src/
├── background/
│   └── background.ts      # Service worker: intercepts .docx/.xlsx/.pptx/.rtf navigation
├── parsers/
│   ├── index.ts           # Dispatcher — dynamic import per format
│   ├── parseDocx.ts       # .docx  via mammoth  (lazy)
│   ├── parseXlsx.ts       # .xlsx  via SheetJS  (lazy)
│   ├── parsePptx.ts       # .pptx  via JSZip XML extraction  (lazy)
│   └── parseRtf.ts        # .rtf   pure-JS tokeniser  (lazy)
├── shared/
│   ├── browser.ts         # Extension / browser detection helpers
│   ├── constants.ts       # App name, storage keys, defaults
│   ├── fileTypes.ts       # Format registry, extension detection, MIME types
│   └── types.ts           # Shared TypeScript interfaces
├── main.ts                # App entry — UI, state, event bindings
└── style.css              # Themes, layout, format-specific styles
```

### Adding a new format

1. Add the extension to `SUPPORTED_EXTENSIONS` and `FORMAT_MAP` in `src/shared/fileTypes.ts`.
2. Create `src/parsers/parseXxx.ts` exporting `async function parseXxx(buf: ArrayBuffer): Promise<ParseResult>`.
3. Add a `case 'xxx'` to the switch in `src/parsers/index.ts`.
4. Update `host_permissions` in both manifest files.
5. Done — no other files need to change.

---

## Performance notes

- Each parser module is a **separate dynamic import** (`import()`), so the initial bundle only contains the app shell and the UI code. Mammoth, SheetJS, and JSZip are fetched from the module cache the first time a file of that type is opened.
- The PPTX parser uses **JSZip** (already a transitive dependency of Mammoth) — no additional install required.
- The RTF parser is **zero-dependency** — a pure-JS tokeniser included directly in the source.
- SheetJS `sheet_to_html` is used instead of `sheet_to_json` to avoid re-building table markup manually, keeping render time proportional to the sheet size.

---

## License

MIT
