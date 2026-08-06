// ─── DOM Cache ────────────────────────────────────────────────────────────────
// Called once after the HTML template has been injected into #app.
// Centralises all getElementById/querySelector calls so the rest of the app
// references typed handles rather than raw selectors scattered everywhere.

export function buildDom() {
  return {
    body: document.body,
    canvas: document.getElementById("app-canvas") as HTMLElement,
    sidebar: document.getElementById("app-sidebar") as HTMLElement,
    documentPaper: document.getElementById("document-paper") as HTMLElement,
    documentContent: document.getElementById("document-content") as HTMLElement,
    documentTitleHeader: document.getElementById(
      "document-title-header",
    ) as HTMLElement,
    landingView: document.getElementById("landing-view") as HTMLElement,
    loadingView: document.getElementById("loading-view") as HTMLElement,
    loadingText: document.getElementById("loading-text") as HTMLElement,
    dropZone: document.getElementById("drop-zone") as HTMLElement,
    localFileNotice: document.getElementById(
      "local-file-notice",
    ) as HTMLElement,
    tocContainer: document.getElementById("toc-container") as HTMLElement,
    searchWidget: document.getElementById("search-widget") as HTMLElement,
    searchInput: document.getElementById("search-input") as HTMLInputElement,
    searchCount: document.getElementById("search-count") as HTMLElement,
    searchNext: document.getElementById("search-next") as HTMLButtonElement,
    searchPrev: document.getElementById("search-prev") as HTMLButtonElement,
    searchClose: document.getElementById("search-close") as HTMLButtonElement,
    sliderFontsize: document.getElementById(
      "slider-fontsize",
    ) as HTMLInputElement,
    labelFontsize: document.getElementById("label-fontsize") as HTMLElement,
    btnSidebarToggle: document.getElementById(
      "btn-sidebar-toggle",
    ) as HTMLButtonElement,
    btnSearchToggle: document.getElementById(
      "btn-search-toggle",
    ) as HTMLButtonElement,
    btnLoadSample: document.getElementById(
      "btn-load-sample",
    ) as HTMLButtonElement,
    btnHome: document.getElementById("btn-home") as HTMLButtonElement,
    btnExportHtml: document.getElementById(
      "btn-export-html",
    ) as HTMLButtonElement,
    fileInput: document.getElementById("doc-upload") as HTMLInputElement,
    statFileName: document.getElementById("stat-filename") as HTMLElement,
    statFileSize: document.getElementById("stat-filesize") as HTMLElement,
    statWords: document.getElementById("stat-words") as HTMLElement,
    statReadTime: document.getElementById("stat-readtime") as HTMLElement,
    scrollProgress: document.getElementById("scroll-progress") as HTMLElement,
  };
}

// The dom handle is populated by main.ts after the template is rendered.
export type Dom = ReturnType<typeof buildDom>;
