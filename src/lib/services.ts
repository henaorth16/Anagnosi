// ─── Services ─────────────────────────────────────────────────────────────────
// All application logic: theme/style helpers, document utilities, local-file
// notice, document loading, drag & drop, search, event bindings, and URL
// query-param loading.  Functions receive `dom` and `state` as arguments so
// this module stays pure (no top-level side-effects) and easy to follow.

import {
  fileNameFromUrl,
  isExtensionContext,
  isFileUrl,
  isFirefox,
} from "../shared/browser";
import { detectFormat, type SupportedFormat } from "../shared/fileTypes";
import { parseFile } from "../parsers/index";
import type { AppState } from "./state";
import {
  searchMatches,
  currentSearchIndex,
  setSearchMatches,
  setCurrentSearchIndex,
} from "./state";
import type { Dom } from "./dom";

// ─── Theme / Style helpers ────────────────────────────────────────────────────

export function setTheme(dom: Dom, state: AppState, theme: AppState["theme"]) {
  state.theme = theme;
  localStorage.setItem("anagnosi-theme", theme);
  dom.body.className = dom.body.className
    .split(" ")
    .filter((c) => !c.startsWith("theme-"))
    .join(" ");
  dom.body.classList.add(`theme-${theme}`);
  document.querySelectorAll(".theme-option").forEach((opt) => {
    opt.classList.toggle("active", opt.getAttribute("data-theme") === theme);
  });
}

export function setFontFamily(
  dom: Dom,
  state: AppState,
  font: AppState["fontFamily"],
) {
  state.fontFamily = font;
  localStorage.setItem("anagnosi-font-family", font);
  dom.documentContent.className = dom.documentContent.className
    .split(" ")
    .filter((c) => !c.startsWith("font-"))
    .join(" ");
  dom.documentContent.classList.add(font);
  document.querySelectorAll("[data-font]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-font") === font);
  });
}

export function setPageWidth(
  dom: Dom,
  state: AppState,
  width: AppState["pageWidth"],
) {
  state.pageWidth = width;
  localStorage.setItem("anagnosi-page-width", width);
  dom.documentPaper.className = dom.documentPaper.className
    .split(" ")
    .filter((c) => !c.startsWith("width-"))
    .join(" ");
  dom.documentPaper.classList.add(width);
  document.querySelectorAll("[data-width]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-width") === width);
  });
}

export function setLineHeight(dom: Dom, state: AppState, height: number) {
  state.lineHeight = height;
  localStorage.setItem("anagnosi-line-height", height.toString());
  dom.documentContent.style.setProperty("--line-height", height.toString());
  document.querySelectorAll("[data-spacing]").forEach((btn) => {
    const val = parseFloat(btn.getAttribute("data-spacing") || "1.6");
    btn.classList.toggle("active", Math.abs(val - height) < 0.05);
  });
}

export function setFontSize(dom: Dom, state: AppState, size: number) {
  state.fontSize = size;
  localStorage.setItem("anagnosi-font-size", size.toString());
  dom.documentContent.style.setProperty("--font-size", `${size}px`);
  dom.sliderFontsize.value = size.toString();
  dom.labelFontsize.textContent = `${size}px`;
}

export function initSettingsUI(dom: Dom, state: AppState) {
  setTheme(dom, state, state.theme);
  setFontFamily(dom, state, state.fontFamily);
  setPageWidth(dom, state, state.pageWidth);
  setLineHeight(dom, state, state.lineHeight);
  setFontSize(dom, state, state.fontSize);
  updateTabUI(state);
}

export function updateTabUI(state: AppState) {
  const t = state.activeTab;
  document
    .getElementById("tab-outline")!
    .classList.toggle("active", t === "outline");
  document
    .getElementById("tab-settings")!
    .classList.toggle("active", t === "settings");
  (
    document.getElementById("tab-content-outline") as HTMLElement
  ).style.display = t === "outline" ? "flex" : "none";
  (
    document.getElementById("tab-content-settings") as HTMLElement
  ).style.display = t === "settings" ? "flex" : "none";
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function calculateStats(dom: Dom, state: AppState) {
  const text = dom.documentContent.textContent || "";
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  state.wordCount = words.length;
  state.readingTime = Math.max(1, Math.ceil(words.length / 225));
  dom.statWords.textContent = state.wordCount.toLocaleString();
  dom.statReadTime.textContent = `${state.readingTime} min`;
}

export function generateOutline(dom: Dom) {
  const headings = dom.documentContent.querySelectorAll("h1, h2, h3, h4");
  if (headings.length === 0) {
    dom.tocContainer.innerHTML = `<div class="toc-empty">No headings found in this document.</div>`;
    return;
  }
  const tocList = document.createElement("ul");
  tocList.className = "toc-list";
  headings.forEach((heading, index) => {
    const el = heading as HTMLElement;
    if (!el.id) el.id = `h-anchor-${index}`;
    const tagName = el.tagName.toLowerCase();
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = `toc-item toc-item-${tagName}`;
    link.textContent = el.textContent || `Section ${index + 1}`;
    link.setAttribute("data-target", el.id);
    link.addEventListener("click", (e) => {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      document
        .querySelectorAll(".toc-item")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
    item.appendChild(link);
    tocList.appendChild(item);
  });
  dom.tocContainer.innerHTML = "";
  dom.tocContainer.appendChild(tocList);
}

export function handleScroll(dom: Dom) {
  const el = dom.canvas;
  const scrollHeight = el.scrollHeight - el.clientHeight;
  if (scrollHeight > 0) {
    dom.scrollProgress.style.width = `${(el.scrollTop / scrollHeight) * 100}%`;
  }
  const headings = dom.documentContent.querySelectorAll("h1, h2, h3");
  if (headings.length === 0) return;
  let activeId = "";
  const canvasTop = dom.canvas.getBoundingClientRect().top;
  for (let i = 0; i < headings.length; i++) {
    const rect = (headings[i] as HTMLElement).getBoundingClientRect();
    if (rect.top - canvasTop <= 110) activeId = (headings[i] as HTMLElement).id;
    else break;
  }
  if (!activeId) activeId = (headings[0] as HTMLElement).id;
  document.querySelectorAll(".toc-item").forEach((item) => {
    const isTarget = item.getAttribute("data-target") === activeId;
    item.classList.toggle("active", isTarget);
    if (isTarget) item.scrollIntoView({ block: "nearest" });
  });
}

// ─── Local-file notice ────────────────────────────────────────────────────────

export function hideLocalFileNotice(dom: Dom) {
  dom.localFileNotice.style.display = "none";
  dom.localFileNotice.innerHTML = "";
  dom.dropZone.classList.remove("drop-zone--highlight");
}

type LocalFileFallbackReason = "firefox" | "chrome-denied" | "web";

export function showLocalFileFallback(
  dom: Dom,
  options: { fileName?: string; reason: LocalFileFallbackReason },
) {
  dom.loadingView.style.display = "none";
  dom.documentPaper.style.display = "none";
  dom.landingView.style.display = "flex";
  dom.btnSearchToggle.disabled = true;
  dom.btnExportHtml.disabled = true;
  dom.documentTitleHeader.textContent = "No document open";

  const label = options.fileName
    ? `<strong>${escapeHtml(options.fileName)}</strong>`
    : "your local file";

  const body =
    options.reason === "firefox"
      ? `<p>Firefox cannot open local files from disk automatically. Open ${label} using the drop zone below or the <strong>Open File</strong> button.</p>`
      : options.reason === "chrome-denied"
        ? `<p>Could not read ${label} automatically. In Chrome, open <code>chrome://extensions</code>, open this extension's <strong>Details</strong>, and enable <strong>Allow access to file URLs</strong> — or use the drop zone below.</p>`
        : `<p>Local files cannot be opened from a URL on the web. Open ${label} using the drop zone below or the <strong>Open File</strong> button.</p>`;

  dom.localFileNotice.innerHTML = `${body}<button type="button" class="btn btn-primary local-file-notice-btn" data-action="pick-file">Choose file…</button>`;
  dom.localFileNotice.style.display = "block";
  dom.dropZone.classList.add("drop-zone--highlight");
}

// ─── Document loading ─────────────────────────────────────────────────────────

/** Loading-message labels per format — shown in the spinner during parse */
export const LOADING_LABELS: Record<SupportedFormat, string> = {
  docx: "Parsing Word document…",
  xlsx: "Parsing Excel spreadsheet…",
  pptx: "Parsing PowerPoint presentation…",
  rtf: "Parsing RTF document…",
};

/** CSS class added to document-paper to scope format-specific styles */
function formatClass(fmt: SupportedFormat): string {
  return `doc-format-${fmt}`;
}

export async function loadDocument(
  dom: Dom,
  state: AppState,
  arrayBuffer: ArrayBuffer,
  name: string,
  size: number,
  format: SupportedFormat,
) {
  hideLocalFileNotice(dom);

  dom.landingView.style.display = "none";
  dom.documentPaper.style.display = "none";
  dom.loadingView.style.display = "flex";
  dom.loadingText.textContent = LOADING_LABELS[format];

  state.fileName = name;
  state.fileSize = formatBytes(size);
  state.currentFormat = format;
  dom.statFileName.textContent = name;
  dom.statFileSize.textContent = state.fileSize;
  dom.documentTitleHeader.textContent = name;

  // Swap format class on the paper element
  dom.documentPaper.className = dom.documentPaper.className
    .split(" ")
    .filter((c) => !c.startsWith("doc-format-"))
    .join(" ");
  dom.documentPaper.classList.add(formatClass(format));

  try {
    const { html, warnings } = await parseFile(arrayBuffer, format);

    if (warnings.length > 0) {
      console.warn(`[Anagnosi] ${format} parse warnings:`, warnings);
    }

    dom.documentContent.innerHTML = html;
    calculateStats(dom, state);
    generateOutline(dom);

    dom.loadingView.style.display = "none";
    dom.documentPaper.style.display = "block";
    dom.btnSearchToggle.disabled = false;
    dom.btnExportHtml.disabled = false;

    closeSearch(dom);
    dom.canvas.scrollTop = 0;
  } catch (err) {
    console.error(`[Anagnosi] Failed to parse ${format}:`, err);
    alert(
      `Could not open the file. Please ensure it is a valid, uncorrupted .${format} file.`,
    );
    dom.loadingView.style.display = "none";
    dom.landingView.style.display = "flex";
    dom.btnSearchToggle.disabled = true;
    dom.btnExportHtml.disabled = true;
    dom.documentTitleHeader.textContent = "No document open";
  }
}

export function showLanding(dom: Dom, state: AppState) {
  dom.loadingView.style.display = "none";
  dom.documentPaper.style.display = "none";
  dom.landingView.style.display = "flex";
  dom.btnSearchToggle.disabled = true;
  dom.btnExportHtml.disabled = true;
  dom.documentTitleHeader.textContent = "No document open";
  dom.documentContent.innerHTML = "";
  dom.tocContainer.innerHTML =
    '<div class="toc-empty">No outline available. Load a document to generate the outline.</div>';
  dom.statFileName.textContent = "-";
  dom.statFileSize.textContent = "-";
  dom.statWords.textContent = "-";
  dom.statReadTime.textContent = "-";
  state.fileName = "";
  state.fileSize = "";
  state.wordCount = 0;
  state.readingTime = 0;
  state.currentFormat = null;
  hideLocalFileNotice(dom);
  closeSearch(dom);
}

export async function loadSampleDoc(dom: Dom, state: AppState) {
  dom.landingView.style.display = "none";
  dom.loadingView.style.display = "flex";
  dom.loadingText.textContent = LOADING_LABELS.docx;
  try {
    const response = await fetch("/sample.docx");
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const buffer = await response.arrayBuffer();
    await loadDocument(
      dom,
      state,
      buffer,
      "sample.docx",
      buffer.byteLength,
      "docx",
    );
  } catch (err) {
    console.error("Failed to fetch sample.docx:", err);
    dom.loadingView.style.display = "none";
    dom.landingView.style.display = "flex";
  }
}

// ─── Drag & Drop ──────────────────────────────────────────────────────────────

export function initDragAndDrop(dom: Dom, state: AppState) {
  ["dragenter", "dragover"].forEach((ev) => {
    dom.dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.dropZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    dom.dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.dropZone.classList.remove("dragover");
    });
  });

  dom.dropZone.addEventListener("drop", async (e) => {
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    const format = detectFormat(file.name);
    if (!format) {
      alert(
        "Unsupported file type. Please drop a .docx, .xlsx, .pptx, or .rtf file.",
      );
      return;
    }
    const buffer = await file.arrayBuffer();
    await loadDocument(dom, state, buffer, file.name, file.size, format);
  });

  dom.dropZone.addEventListener("click", () => dom.fileInput.click());
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function highlightSearch(container: HTMLElement, term: string): number {
  removeHighlights(container);
  if (!term.trim()) return 0;
  let count = 0;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || "";
      if (!regex.test(text)) return;
      const parent = node.parentNode;
      if (
        !parent ||
        parent.nodeName === "SCRIPT" ||
        parent.nodeName === "STYLE"
      )
        return;
      const fragment = document.createDocumentFragment();
      text.split(regex).forEach((part) => {
        if (regex.test(part)) {
          const span = document.createElement("span");
          span.className = "match-highlight";
          span.textContent = part;
          fragment.appendChild(span);
          count++;
        } else if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      parent.replaceChild(fragment, node);
    } else {
      Array.from(node.childNodes).forEach(walk);
    }
  }
  walk(container);
  return count;
}

export function removeHighlights(container: HTMLElement) {
  container.querySelectorAll(".match-highlight").forEach((hl) => {
    const parent = hl.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(hl.textContent || ""), hl);
      parent.normalize();
    }
  });
}

export function triggerSearch(dom: Dom) {
  const count = highlightSearch(dom.documentContent, dom.searchInput.value);
  if (count > 0) {
    setCurrentSearchIndex(0);
    setSearchMatches(
      Array.from(
        dom.documentContent.querySelectorAll(".match-highlight"),
      ) as HTMLElement[],
    );
    searchMatches[0].classList.add("active");
    searchMatches[0].scrollIntoView({ behavior: "smooth", block: "center" });
    dom.searchCount.textContent = `1 of ${count}`;
  } else {
    setCurrentSearchIndex(-1);
    setSearchMatches([]);
    dom.searchCount.textContent = "0 of 0";
  }
}

export function navigateSearch(dom: Dom, direction: "next" | "prev") {
  if (!searchMatches.length) return;
  searchMatches[currentSearchIndex].classList.remove("active");
  const next =
    direction === "next"
      ? (currentSearchIndex + 1) % searchMatches.length
      : (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
  setCurrentSearchIndex(next);
  const active = searchMatches[next];
  active.classList.add("active");
  active.scrollIntoView({ behavior: "smooth", block: "center" });
  dom.searchCount.textContent = `${next + 1} of ${searchMatches.length}`;
}

export function toggleSearchWidget(dom: Dom) {
  if (dom.btnSearchToggle.disabled) return;
  const isActive = dom.searchWidget.classList.toggle("active");
  if (isActive) {
    dom.searchInput.focus();
    if (dom.searchInput.value) triggerSearch(dom);
  } else {
    closeSearch(dom);
  }
}

export function closeSearch(dom: Dom) {
  dom.searchWidget.classList.remove("active");
  dom.searchInput.value = "";
  removeHighlights(dom.documentContent);
  setSearchMatches([]);
  setCurrentSearchIndex(-1);
  dom.searchCount.textContent = "0 of 0";
}

// ─── Event bindings ───────────────────────────────────────────────────────────

export function bindEvents(dom: Dom, state: AppState) {
  dom.localFileNotice.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-action='pick-file']"))
      dom.fileInput.click();
  });

  dom.fileInput.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const format = detectFormat(file.name);
    if (!format) {
      alert(
        "Unsupported file type. Please choose a .docx, .xlsx, .pptx, or .rtf file.",
      );
      return;
    }
    const buffer = await file.arrayBuffer();
    await loadDocument(dom, state, buffer, file.name, file.size, format);
    dom.fileInput.value = "";
  });

  initDragAndDrop(dom, state);
  dom.btnLoadSample.addEventListener("click", () => loadSampleDoc(dom, state));
  dom.btnHome.addEventListener("click", () => showLanding(dom, state));

  dom.btnSidebarToggle.addEventListener("click", () => {
    state.sidebarOpen = !state.sidebarOpen;
    localStorage.setItem("anagnosi-sidebar-open", state.sidebarOpen.toString());
    dom.sidebar.classList.toggle("collapsed", !state.sidebarOpen);
  });

  document.getElementById("tab-outline")!.addEventListener("click", () => {
    state.activeTab = "outline";
    updateTabUI(state);
  });
  document.getElementById("tab-settings")!.addEventListener("click", () => {
    state.activeTab = "settings";
    updateTabUI(state);
  });

  document.querySelectorAll(".theme-option").forEach((opt) =>
    opt.addEventListener("click", () => {
      const t = opt.getAttribute("data-theme") as AppState["theme"];
      if (t) setTheme(dom, state, t);
    }),
  );
  document.querySelectorAll("[data-font]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const f = btn.getAttribute("data-font") as AppState["fontFamily"];
      if (f) setFontFamily(dom, state, f);
    }),
  );
  document.querySelectorAll("[data-width]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const w = btn.getAttribute("data-width") as AppState["pageWidth"];
      if (w) setPageWidth(dom, state, w);
    }),
  );
  document
    .querySelectorAll("[data-spacing]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        setLineHeight(
          dom,
          state,
          parseFloat(btn.getAttribute("data-spacing") || "1.6"),
        ),
      ),
    );
  dom.sliderFontsize.addEventListener("input", () =>
    setFontSize(dom, state, parseInt(dom.sliderFontsize.value)),
  );

  dom.btnSearchToggle.addEventListener("click", () => toggleSearchWidget(dom));
  dom.searchInput.addEventListener("input", () => triggerSearch(dom));
  dom.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateSearch(dom, "next");
    } else if (e.key === "Escape") closeSearch(dom);
  });
  dom.searchNext.addEventListener("click", () => navigateSearch(dom, "next"));
  dom.searchPrev.addEventListener("click", () => navigateSearch(dom, "prev"));
  dom.searchClose.addEventListener("click", () => closeSearch(dom));

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      toggleSearchWidget(dom);
    }
  });

  dom.canvas.addEventListener("scroll", () => handleScroll(dom));

  dom.btnExportHtml.addEventListener("click", () => {
    if (dom.btnExportHtml.disabled) return;
    const clean = dom.documentContent.cloneNode(true) as HTMLElement;
    removeHighlights(clean);
    const blob = new Blob([clean.innerHTML], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${state.fileName.replace(/\.\w+$/, "")}_parsed.html`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// ─── URL query-param loading ──────────────────────────────────────────────────

export async function loadFromQueryParam(dom: Dom, state: AppState) {
  const params = new URLSearchParams(window.location.search);

  // Firefox redirect: ?local=1&name=<file>&fmt=<format>
  if (params.get("local") === "1") {
    showLocalFileFallback(dom, {
      fileName: params.get("name")
        ? decodeURIComponent(params.get("name")!)
        : undefined,
      reason: "firefox",
    });
    return;
  }

  const fileUrl = params.get("file");
  if (!fileUrl) return;

  const decodedUrl = decodeURIComponent(fileUrl);
  const fileName = fileNameFromUrl(decodedUrl);
  const format: SupportedFormat =
    (params.get("fmt") as SupportedFormat | null) ??
    detectFormat(fileName) ??
    "docx";

  if (isFileUrl(decodedUrl)) {
    if (!isExtensionContext()) {
      showLocalFileFallback(dom, { fileName, reason: "web" });
      return;
    }
    if (isFirefox()) {
      showLocalFileFallback(dom, { fileName, reason: "firefox" });
      return;
    }
  }

  dom.landingView.style.display = "none";
  dom.documentPaper.style.display = "none";
  dom.loadingView.style.display = "flex";
  dom.loadingText.textContent = LOADING_LABELS[format];
  dom.statFileName.textContent = fileName;
  dom.documentTitleHeader.textContent = fileName;

  try {
    const response = await fetch(decodedUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    await loadDocument(dom, state, buffer, fileName, buffer.byteLength, format);
  } catch (err) {
    console.error("[Anagnosi] Failed to fetch from URL:", err);
    if (isFileUrl(decodedUrl)) {
      showLocalFileFallback(dom, {
        fileName,
        reason: isExtensionContext()
          ? isFirefox()
            ? "firefox"
            : "chrome-denied"
          : "web",
      });
    } else {
      alert("Could not load the document from the URL: " + decodedUrl);
      dom.loadingView.style.display = "none";
      dom.landingView.style.display = "flex";
      dom.btnSearchToggle.disabled = true;
      dom.btnExportHtml.disabled = true;
      dom.documentTitleHeader.textContent = "No document open";
    }
  }
}
