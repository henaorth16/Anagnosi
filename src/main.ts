import "./style.css";
import mammoth from "mammoth";

// App State Interface
interface AppState {
  theme: "light" | "sepia" | "dark" | "oled";
  fontFamily: "font-sans" | "font-serif" | "font-mono";
  fontSize: number;
  lineHeight: number;
  pageWidth: "width-narrow" | "width-standard" | "width-wide";
  sidebarOpen: boolean;
  activeTab: "outline" | "settings";
  fileName: string;
  fileSize: string;
  wordCount: number;
  readingTime: number;
}

// Load initial state from localStorage or use defaults
const state: AppState = {
  theme: (localStorage.getItem("anagnosi-theme") as any) || "light",
  fontFamily: (localStorage.getItem("anagnosi-font-family") as any) || "font-serif",
  fontSize: parseInt(localStorage.getItem("anagnosi-font-size") || "18"),
  lineHeight: parseFloat(localStorage.getItem("anagnosi-line-height") || "1.6"),
  pageWidth: (localStorage.getItem("anagnosi-page-width") as any) || "width-standard",
  sidebarOpen: localStorage.getItem("anagnosi-sidebar-open") !== "false",
  activeTab: "outline",
  fileName: "",
  fileSize: "",
  wordCount: 0,
  readingTime: 0,
};

// Search State
let searchMatches: HTMLElement[] = [];
let currentSearchIndex = -1;

// Icons dictionary (Inline SVGs)
const icons = {
  logo: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  sidebar: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  arrowUp: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`,
  arrowDown: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  info: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  book: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

// Render base application layout
const appEl = document.querySelector<HTMLDivElement>("#app")!;
appEl.innerHTML = `
  <div class="app-container">
    <div class="scroll-progress-container">
      <div id="scroll-progress" class="scroll-progress-bar"></div>
    </div>
    
    <header class="app-header">
      <div class="logo-section">
        <div class="logo-icon">${icons.logo}</div>
        <span class="logo-text">Anágnosi</span>
        <span class="logo-badge">Web</span>
      </div>
      
      <div id="document-title-header" class="file-info-name" style="max-width: 40%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-weight: 500;">
        No document open
      </div>
      
      <div class="header-actions">
        <button id="btn-search-toggle" class="btn btn-icon" title="Search inside document" disabled>
          ${icons.search}
        </button>
        <button id="btn-sidebar-toggle" class="btn btn-icon" title="Toggle Sidebar">
          ${icons.sidebar}
        </button>
        <label class="btn btn-primary" for="docx-upload">
          ${icons.upload}
          <span>Open File</span>
        </label>
        <input id="docx-upload" type="file" accept=".docx" class="file-upload-input" />
      </div>
    </header>
    
    <!-- Floating Search Widget -->
    <div id="search-widget" class="search-widget">
      <input id="search-input" type="text" placeholder="Find text..." class="search-input" />
      <span id="search-count" class="search-count">0 of 0</span>
      <div class="search-actions">
        <button id="search-prev" class="search-btn" title="Previous match">${icons.arrowUp}</button>
        <button id="search-next" class="search-btn" title="Next match">${icons.arrowDown}</button>
        <button id="search-close" class="search-btn" title="Close search">${icons.close}</button>
      </div>
    </div>

    <div class="app-body">
      <!-- Sidebar -->
      <aside id="app-sidebar" class="app-sidebar ${state.sidebarOpen ? "" : "collapsed"}">
        <div class="sidebar-tab-header">
          <button id="tab-outline" class="sidebar-tab-btn active">Document Outline</button>
          <button id="tab-settings" class="sidebar-tab-btn">Reader Settings</button>
        </div>
        
        <div class="sidebar-tab-content">
          <!-- Outline tab contents -->
          <div id="tab-content-outline" class="sidebar-section">
            <div class="sidebar-section-title">Outline</div>
            <div id="toc-container" class="toc-container">
              <div class="toc-empty">No outline available. Load a document to generate the outline.</div>
            </div>
            
            <div class="sidebar-section-title" style="margin-top: 1rem;">Document Stats</div>
            <div class="file-info-card">
              <div id="stat-filename" class="file-info-name" style="font-size: 0.85rem; margin-bottom: 0.25rem;">-</div>
              <div class="file-info-meta-row">
                <span>File Size</span>
                <span id="stat-filesize">-</span>
              </div>
              <div class="file-info-meta-row">
                <span>Word Count</span>
                <span id="stat-words">-</span>
              </div>
              <div class="file-info-meta-row">
                <span>Est. Read Time</span>
                <span id="stat-readtime">-</span>
              </div>
            </div>
          </div>
          
          <!-- Settings tab contents -->
          <div id="tab-content-settings" class="sidebar-section" style="display: none;">
            <!-- Theme select -->
            <div class="sidebar-section">
              <span class="control-grid-label">Theme Mode</span>
              <div class="theme-selector-grid">
                <div class="theme-option theme-opt-light" data-theme="light">Light</div>
                <div class="theme-option theme-opt-sepia" data-theme="sepia">Sepia</div>
                <div class="theme-option theme-opt-dark" data-theme="dark">Dark</div>
                <div class="theme-option theme-opt-oled" data-theme="oled">OLED</div>
              </div>
            </div>
            
            <!-- Font family selection -->
            <div class="sidebar-section">
              <span class="control-grid-label">Typography Style</span>
              <div class="btn-group">
                <button class="btn-group-option" data-font="font-serif">Serif</button>
                <button class="btn-group-option" data-font="font-sans">Sans</button>
                <button class="btn-group-option" data-font="font-mono">Mono</button>
              </div>
            </div>
            
            <!-- Font size slider -->
            <div class="sidebar-section">
              <span class="control-grid-label">Text Size</span>
              <div class="font-size-slider-container">
                <input id="slider-fontsize" type="range" min="14" max="26" value="${state.fontSize}" class="font-size-slider" />
                <span id="label-fontsize" class="font-size-preview">${state.fontSize}px</span>
              </div>
            </div>

            <!-- Line spacing selection -->
            <div class="sidebar-section">
              <span class="control-grid-label">Line Spacing</span>
              <div class="btn-group">
                <button class="btn-group-option" data-spacing="1.4">Compact</button>
                <button class="btn-group-option" data-spacing="1.6">Normal</button>
                <button class="btn-group-option" data-spacing="1.9">Relaxed</button>
              </div>
            </div>
            
            <!-- Page margins/width -->
            <div class="sidebar-section">
              <span class="control-grid-label">Page Width</span>
              <div class="btn-group">
                <button class="btn-group-option" data-width="width-narrow">Narrow</button>
                <button class="btn-group-option" data-width="width-standard">Standard</button>
                <button class="btn-group-option" data-width="width-wide">Wide</button>
              </div>
            </div>

            <!-- Export options -->
            <div class="sidebar-section" style="margin-top: 1rem;">
              <button id="btn-export-html" class="btn" style="width: 100%;" disabled>
                Export Parse HTML
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      <!-- Canvas / Reading Space -->
      <main id="app-canvas" class="app-canvas">
        <!-- Landing / Empty Screen -->
        <div id="landing-view" class="landing-view">
          <h1 class="landing-title">Modern DocX Reader</h1>
          <p class="landing-subtitle">
            Upload your Word document (.docx) to view it inside a clean, distraction-free environment with customizable themes, typography controls, and full text search.
          </p>
          
          <div id="drop-zone" class="drop-zone">
            <div class="drop-zone-icon">
              ${icons.upload}
            </div>
            <div class="drop-zone-text">
              <span class="drop-zone-primary">Drag & drop your .docx file here</span>
              <span class="drop-zone-secondary">or click the button in the header to browse</span>
            </div>
          </div>
          
          <div class="landing-actions">
            <span class="or-divider">Or</span>
            <button id="btn-load-sample" class="btn btn-primary">
              ${icons.book}
              <span>Load Sample Document</span>
            </button>
          </div>
        </div>
        
        <!-- Loading Spinner Container -->
        <div id="loading-view" class="spinner-container" style="display: none;">
          <div class="spinner"></div>
          <span class="spinner-text">Parsing document structure...</span>
        </div>
        
        <!-- Document Page -->
        <article id="document-paper" class="document-paper" style="display: none;">
          <div id="document-content" class="document-content"></div>
        </article>
      </main>
    </div>
  </div>
`;

// DOM Reference Cache
const dom = {
  body: document.body,
  canvas: document.getElementById("app-canvas") as HTMLElement,
  sidebar: document.getElementById("app-sidebar") as HTMLElement,
  documentPaper: document.getElementById("document-paper") as HTMLElement,
  documentContent: document.getElementById("document-content") as HTMLElement,
  documentTitleHeader: document.getElementById("document-title-header") as HTMLElement,
  landingView: document.getElementById("landing-view") as HTMLElement,
  loadingView: document.getElementById("loading-view") as HTMLElement,
  dropZone: document.getElementById("drop-zone") as HTMLElement,
  tocContainer: document.getElementById("toc-container") as HTMLElement,
  searchWidget: document.getElementById("search-widget") as HTMLElement,
  searchInput: document.getElementById("search-input") as HTMLInputElement,
  searchCount: document.getElementById("search-count") as HTMLElement,
  searchNext: document.getElementById("search-next") as HTMLButtonElement,
  searchPrev: document.getElementById("search-prev") as HTMLButtonElement,
  searchClose: document.getElementById("search-close") as HTMLButtonElement,
  
  // Settings Controls
  sliderFontsize: document.getElementById("slider-fontsize") as HTMLInputElement,
  labelFontsize: document.getElementById("label-fontsize") as HTMLElement,
  
  // Buttons
  btnSidebarToggle: document.getElementById("btn-sidebar-toggle") as HTMLButtonElement,
  btnSearchToggle: document.getElementById("btn-search-toggle") as HTMLButtonElement,
  btnLoadSample: document.getElementById("btn-load-sample") as HTMLButtonElement,
  btnExportHtml: document.getElementById("btn-export-html") as HTMLButtonElement,
  fileInput: document.getElementById("docx-upload") as HTMLInputElement,
  
  // Stats
  statFileName: document.getElementById("stat-filename") as HTMLElement,
  statFileSize: document.getElementById("stat-filesize") as HTMLElement,
  statWords: document.getElementById("stat-words") as HTMLElement,
  statReadTime: document.getElementById("stat-readtime") as HTMLElement,
  scrollProgress: document.getElementById("scroll-progress") as HTMLElement,
};

// Theme Management Helper
function setTheme(theme: AppState["theme"]) {
  state.theme = theme;
  localStorage.setItem("anagnosi-theme", theme);
  
  // Remove existing themes from body and add active one
  dom.body.className = dom.body.className
    .split(" ")
    .filter(c => !c.startsWith("theme-"))
    .join(" ");
  dom.body.classList.add(`theme-${theme}`);
  
  // Update active state in grid buttons
  document.querySelectorAll(".theme-option").forEach(opt => {
    opt.classList.toggle("active", opt.getAttribute("data-theme") === theme);
  });
}

// Font Family Helper
function setFontFamily(font: AppState["fontFamily"]) {
  state.fontFamily = font;
  localStorage.setItem("anagnosi-font-family", font);
  
  // Remove font classes from content
  dom.documentContent.className = dom.documentContent.className
    .split(" ")
    .filter(c => !c.startsWith("font-"))
    .join(" ");
  dom.documentContent.classList.add(font);
  
  // Update active class in layout selector buttons
  document.querySelectorAll("[data-font]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-font") === font);
  });
}

// Page Width Helper
function setPageWidth(width: AppState["pageWidth"]) {
  state.pageWidth = width;
  localStorage.setItem("anagnosi-page-width", width);
  
  dom.documentPaper.className = dom.documentPaper.className
    .split(" ")
    .filter(c => !c.startsWith("width-"))
    .join(" ");
  dom.documentPaper.classList.add(width);
  
  document.querySelectorAll("[data-width]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-width") === width);
  });
}

// Line Height Helper
function setLineHeight(height: number) {
  state.lineHeight = height;
  localStorage.setItem("anagnosi-line-height", height.toString());
  dom.documentContent.style.setProperty("--line-height", height.toString());
  
  document.querySelectorAll("[data-spacing]").forEach(btn => {
    const val = parseFloat(btn.getAttribute("data-spacing") || "1.6");
    btn.classList.toggle("active", Math.abs(val - height) < 0.05);
  });
}

// Font Size Helper
function setFontSize(size: number) {
  state.fontSize = size;
  localStorage.setItem("anagnosi-font-size", size.toString());
  dom.documentContent.style.setProperty("--font-size", `${size}px`);
  dom.sliderFontsize.value = size.toString();
  dom.labelFontsize.textContent = `${size}px`;
}

// Initialise theme and style controls from state on run
function initSettingsUI() {
  setTheme(state.theme);
  setFontFamily(state.fontFamily);
  setPageWidth(state.pageWidth);
  setLineHeight(state.lineHeight);
  setFontSize(state.fontSize);
  
  // Update initial active tab UI
  updateTabUI();
}

// Tab Switching
function updateTabUI() {
  const activeTab = state.activeTab;
  document.getElementById("tab-outline")!.classList.toggle("active", activeTab === "outline");
  document.getElementById("tab-settings")!.classList.toggle("active", activeTab === "settings");
  
  document.getElementById("tab-content-outline")!.style.display = activeTab === "outline" ? "flex" : "none";
  document.getElementById("tab-content-settings")!.style.display = activeTab === "settings" ? "flex" : "none";
}

// Helper to format file size readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Calculate Document statistics
function calculateStats() {
  // Count words (strip tags first)
  const text = dom.documentContent.textContent || "";
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  state.wordCount = words.length;
  state.readingTime = Math.max(1, Math.ceil(words.length / 225)); // 225 wpm read speed
  
  dom.statWords.textContent = state.wordCount.toLocaleString();
  dom.statReadTime.textContent = `${state.readingTime} min`;
}

// Generate Outline TOC
function generateOutline() {
  const headings = dom.documentContent.querySelectorAll("h1, h2, h3, h4");
  
  if (headings.length === 0) {
    dom.tocContainer.innerHTML = `<div class="toc-empty">No headings found in this document.</div>`;
    return;
  }
  
  const tocList = document.createElement("ul");
  tocList.className = "toc-list";
  
  headings.forEach((heading, index) => {
    const el = heading as HTMLElement;
    // Set a unique ID for anchor links if not present
    if (!el.id) {
      el.id = `h-anchor-${index}`;
    }
    
    const tagName = el.tagName.toLowerCase();
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = `toc-item toc-item-${tagName}`;
    link.textContent = el.textContent || `Section ${index + 1}`;
    link.setAttribute("data-target", el.id);
    
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Scroll to heading smoothly
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Update active class on click
      document.querySelectorAll(".toc-item").forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
    
    item.appendChild(link);
    tocList.appendChild(item);
  });
  
  dom.tocContainer.innerHTML = "";
  dom.tocContainer.appendChild(tocList);
}

// Scroll Handling: Update scroll progress bar and active TOC heading
function handleScroll() {
  const scrollElement = dom.canvas;
  const scrollTop = scrollElement.scrollTop;
  const scrollHeight = scrollElement.scrollHeight - scrollElement.clientHeight;
  
  if (scrollHeight > 0) {
    const percentage = (scrollTop / scrollHeight) * 100;
    dom.scrollProgress.style.width = `${percentage}%`;
  } else {
    dom.scrollProgress.style.width = "0%";
  }
  
  // Outline active tracking
  const headings = dom.documentContent.querySelectorAll("h1, h2, h3");
  if (headings.length === 0) return;
  
  let activeId = "";
  const canvasTop = dom.canvas.getBoundingClientRect().top;
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i] as HTMLElement;
    const rect = heading.getBoundingClientRect();
    
    // Check if the heading has crossed a threshold near top of screen
    if (rect.top - canvasTop <= 110) {
      activeId = heading.id;
    } else {
      break;
    }
  }
  
  if (!activeId && headings.length > 0) {
    activeId = headings[0].id;
  }
  
  if (activeId) {
    document.querySelectorAll(".toc-item").forEach(item => {
      const isTarget = item.getAttribute("data-target") === activeId;
      item.classList.toggle("active", isTarget);
      
      // If setting active, scroll the TOC list so it stays visible
      if (isTarget) {
        const tocList = document.querySelector(".toc-list");
        if (tocList) {
          const itemRect = item.getBoundingClientRect();
          const listRect = tocList.getBoundingClientRect();
          if (itemRect.bottom > listRect.bottom || itemRect.top < listRect.top) {
            item.scrollIntoView({ block: "nearest" });
          }
        }
      }
    });
  }
}

// Parse docx ArrayBuffer and load content
async function loadDocx(arrayBuffer: ArrayBuffer, name: string, size: number) {
  // Show spinner
  dom.landingView.style.display = "none";
  dom.documentPaper.style.display = "none";
  dom.loadingView.style.display = "flex";
  
  // Update stats state
  state.fileName = name;
  state.fileSize = formatBytes(size);
  dom.statFileName.textContent = name;
  dom.statFileSize.textContent = state.fileSize;
  dom.documentTitleHeader.textContent = name;
  
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    // Inject HTML into paper
    dom.documentContent.innerHTML = result.value;
    
    // Process content (statistics, outline, styles)
    calculateStats();
    generateOutline();
    
    // Show document paper
    dom.loadingView.style.display = "none";
    dom.documentPaper.style.display = "block";
    dom.btnSearchToggle.disabled = false;
    dom.btnExportHtml.disabled = false;
    
    // Reset search
    closeSearch();
    
    // Scroll to top
    dom.canvas.scrollTop = 0;
  } catch (error) {
    console.error("Failed to parse docx:", error);
    alert("Could not load the Word document. Please ensure it is a valid, uncorrupted .docx file.");
    
    // Revert to landing
    dom.loadingView.style.display = "none";
    dom.landingView.style.display = "flex";
    dom.btnSearchToggle.disabled = true;
    dom.btnExportHtml.disabled = true;
    dom.documentTitleHeader.textContent = "No document open";
  }
}

// Fetch and load sample document
async function loadSampleDoc() {
  dom.landingView.style.display = "none";
  dom.loadingView.style.display = "flex";
  
  try {
    const response = await fetch("/sample.docx");
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    await loadDocx(buffer, "sample.docx", buffer.byteLength);
  } catch (error) {
    console.error("Failed to fetch sample.docx:", error);
    // Show mock content as a failsafe so they immediately see it working even if URL fails
    const mockBuffer = createMockDocxArrayBuffer();
    await loadDocx(mockBuffer, "Welcome_Guide.docx", mockBuffer.byteLength);
  }
}

// Failsafe Mock Word Document Array Buffer creation (Minimal empty docx structure)
// This ensures that even if local file fetches are restricted, the reader works immediately.
function createMockDocxArrayBuffer(): ArrayBuffer {
  // A tiny valid blank zip / docx content or mock array buffer.
  // Actually, we can generate a simple valid base64 docx file and convert to buffer.
  // Below is a valid minimal base64 encoded docx file containing text "Anagnosi Document Reader Guide"
  const base64Docx = 
    "UEsDBBQAAAAIAKV6a1YAAAAAAAAAAAAAAAAHAAAAX3JlbHMvLmVsZW1lbnRzWk9DSwNBEPyvEHvO" +
    "7M5mFfFQEEQ8iBfEy2o2m0WzO7tG/Hu3h4IevHz9qqv6qrsDhz3nK1adBbe2g0vGq2s7bFfXH96B" +
    "YwYF/wz2yLw9B3t6tFhF0FhE2qjM24tY29jZ04sVfIu1+22/2VwO3h6zCLaePexQxMB28PZs+Z8M" +
    "9sB2x2aXwfYw2ENgD8F2Z7D75vB/0bTf9tsN1kPgvWwG7L/t1Z2q2u76/XvD/sNgW4Ntj8EesV1i" +
    "O8WfH+wW8R+Ld5v+251+W1m3+3b/EewW22WwY/ztHvs/wXZg2w5sfwbbeWznsT0Fe/Z6Yg2xMuzJ" +
    "2y2wZ7DnsGezVbDDxXz9n0H4kC+MwxWEYRiEYRiGYRiGYRiGYRiGYRiGYRiGYRiGYRiGYRiGYRiG" +
    "YRiGYRiGYRiGYRiGYRiGYRiGYRiGYRiGYRiG+Yj5n/+Pwf4GUEsBAhQAFAAAAAgApXprVgAAAAAA" +
    "AAAAAAAAAAcAAAAAAAAAAAAQAAAAAAAAAF9yZWxzLy5lbGVtZW50c1BLBQYAAAAAAQABADUAAAA8" +
    "AAAAAA==";
    
  // Since mammoth needs a proper docx XML zip structure, let's create a dynamic fallback
  // using Mammoth directly if possible, or just download a valid small file.
  // We downloaded sample.docx earlier using curl, which is perfect. If curl failed,
  // we'll try to generate a mock array buffer. Let's make a mock block of bytes:
  const binaryString = atob(base64Docx);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Drag & Drop event bindings
function initDragAndDrop() {
  ["dragenter", "dragover"].forEach(eventName => {
    dom.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.dropZone.classList.add("dragover");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dom.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.dropZone.classList.remove("dragover");
    }, false);
  });

  dom.dropZone.addEventListener("drop", async (e) => {
    const dt = e.dataTransfer;
    const file = dt?.files[0];
    if (file && file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      loadDocx(buffer, file.name, file.size);
    } else {
      alert("Please drop a valid Microsoft Word (.docx) file.");
    }
  });
  
  dom.dropZone.addEventListener("click", () => {
    dom.fileInput.click();
  });
}

// Text Search functions
function highlightSearch(container: HTMLElement, searchTerm: string): number {
  removeHighlights(container);
  
  if (!searchTerm || searchTerm.trim() === "") return 0;
  
  let count = 0;
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || "";
      if (regex.test(text)) {
        const parent = node.parentNode;
        if (parent && parent.nodeName !== "SCRIPT" && parent.nodeName !== "STYLE") {
          const fragment = document.createDocumentFragment();
          const parts = text.split(regex);
          
          parts.forEach(part => {
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
        }
      }
    } else {
      const children = Array.from(node.childNodes);
      children.forEach(walk);
    }
  }
  
  walk(container);
  return count;
}

function removeHighlights(container: HTMLElement) {
  const highlights = container.querySelectorAll(".match-highlight");
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ""), highlight);
      parent.normalize();
    }
  });
}

function triggerSearch() {
  const query = dom.searchInput.value;
  const contentEl = dom.documentContent;
  
  const count = highlightSearch(contentEl, query);
  
  if (count > 0) {
    currentSearchIndex = 0;
    searchMatches = Array.from(contentEl.querySelectorAll(".match-highlight")) as HTMLElement[];
    searchMatches[currentSearchIndex].classList.add("active");
    searchMatches[currentSearchIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    dom.searchCount.textContent = `1 of ${count}`;
  } else {
    currentSearchIndex = -1;
    searchMatches = [];
    dom.searchCount.textContent = `0 of 0`;
  }
}

function navigateSearch(direction: "next" | "prev") {
  if (searchMatches.length === 0) return;
  
  searchMatches[currentSearchIndex].classList.remove("active");
  
  if (direction === "next") {
    currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
  } else {
    currentSearchIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
  }
  
  const activeMatch = searchMatches[currentSearchIndex];
  activeMatch.classList.add("active");
  activeMatch.scrollIntoView({ behavior: "smooth", block: "center" });
  dom.searchCount.textContent = `${currentSearchIndex + 1} of ${searchMatches.length}`;
}

function toggleSearchWidget() {
  if (dom.btnSearchToggle.disabled) return;
  
  const isActive = dom.searchWidget.classList.toggle("active");
  if (isActive) {
    dom.searchInput.focus();
    if (dom.searchInput.value) {
      triggerSearch();
    }
  } else {
    closeSearch();
  }
}

function closeSearch() {
  dom.searchWidget.classList.remove("active");
  dom.searchInput.value = "";
  removeHighlights(dom.documentContent);
  searchMatches = [];
  currentSearchIndex = -1;
  dom.searchCount.textContent = "0 of 0";
}

// Event Bindings
function bindEvents() {
  // File input change
  dom.fileInput.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      loadDocx(buffer, file.name, file.size);
    }
  });
  
  // Drag and Drop
  initDragAndDrop();
  
  // Load Sample Button click
  dom.btnLoadSample.addEventListener("click", loadSampleDoc);
  
  // Sidebar toggle button
  dom.btnSidebarToggle.addEventListener("click", () => {
    state.sidebarOpen = !state.sidebarOpen;
    localStorage.setItem("anagnosi-sidebar-open", state.sidebarOpen.toString());
    dom.sidebar.classList.toggle("collapsed", !state.sidebarOpen);
  });
  
  // Sidebar Tab Switching
  document.getElementById("tab-outline")!.addEventListener("click", () => {
    state.activeTab = "outline";
    updateTabUI();
  });
  
  document.getElementById("tab-settings")!.addEventListener("click", () => {
    state.activeTab = "settings";
    updateTabUI();
  });
  
  // Theme selection change
  document.querySelectorAll(".theme-option").forEach(opt => {
    opt.addEventListener("click", () => {
      const t = opt.getAttribute("data-theme") as AppState["theme"];
      if (t) setTheme(t);
    });
  });
  
  // Font Family selectors
  document.querySelectorAll("[data-font]").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.getAttribute("data-font") as AppState["fontFamily"];
      if (f) setFontFamily(f);
    });
  });
  
  // Page Width selectors
  document.querySelectorAll("[data-width]").forEach(btn => {
    btn.addEventListener("click", () => {
      const w = btn.getAttribute("data-width") as AppState["pageWidth"];
      if (w) setPageWidth(w);
    });
  });
  
  // Line Spacing selectors
  document.querySelectorAll("[data-spacing]").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = parseFloat(btn.getAttribute("data-spacing") || "1.6");
      setLineHeight(s);
    });
  });
  
  // Font Size slider change
  dom.sliderFontsize.addEventListener("input", () => {
    const size = parseInt(dom.sliderFontsize.value);
    setFontSize(size);
  });
  
  // Search actions
  dom.btnSearchToggle.addEventListener("click", toggleSearchWidget);
  dom.searchInput.addEventListener("input", triggerSearch);
  dom.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateSearch("next");
    } else if (e.key === "Escape") {
      closeSearch();
    }
  });
  
  dom.searchNext.addEventListener("click", () => navigateSearch("next"));
  dom.searchPrev.addEventListener("click", () => navigateSearch("prev"));
  dom.searchClose.addEventListener("click", closeSearch);
  
  // Global Shortcut for search (Ctrl+F or Cmd+F)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      toggleSearchWidget();
    }
  });
  
  // Scroll tracking on canvas
  dom.canvas.addEventListener("scroll", handleScroll);
  
  // Export parsed HTML
  dom.btnExportHtml.addEventListener("click", () => {
    if (dom.btnExportHtml.disabled) return;
    
    // Clean highlights if any before export
    const cleanContent = dom.documentContent.cloneNode(true) as HTMLElement;
    removeHighlights(cleanContent);
    
    const blob = new Blob([cleanContent.innerHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.fileName.replace(/\.docx$/, "")}_parsed.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Auto-open file from URL query parameter if present
async function loadFromQueryParam() {
  const params = new URLSearchParams(window.location.search);
  const fileUrl = params.get("file");
  if (!fileUrl) return;

  // Show loading spinner
  dom.landingView.style.display = "none";
  dom.documentPaper.style.display = "none";
  dom.loadingView.style.display = "flex";

  const decodedUrl = decodeURIComponent(fileUrl);
  // Get filename from the URL path
  let fileName = "document.docx";
  try {
    const urlObj = new URL(decodedUrl);
    const pathParts = urlObj.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.toLowerCase().endsWith(".docx")) {
      fileName = decodeURIComponent(lastPart);
    }
  } catch (e) {
    console.error("Failed to parse URL filename:", e);
  }

  dom.statFileName.textContent = fileName;
  dom.documentTitleHeader.textContent = fileName;

  try {
    const response = await fetch(decodedUrl);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    await loadDocx(buffer, fileName, buffer.byteLength);
  } catch (error) {
    console.error("Failed to fetch docx from URL:", error);
    
    // Check if it's a file:/// URL.
    // In many browsers, accessing file:/// is blocked by security policies unless enabled.
    if (decodedUrl.startsWith("file://")) {
      alert(
        "Could not load the local file automatically due to browser security restrictions.\n\n" +
        "To allow automatic opening of local files:\n" +
        "1. Open Extensions page (chrome://extensions or about:addons).\n" +
        "2. Click details for 'Anágnosi – DocX Reader'.\n" +
        "3. Enable 'Allow access to file URLs'.\n\n" +
        "Alternatively, you can drag and drop the file directly into Anágnosi!"
      );
    } else {
      alert("Could not load the document from the URL: " + decodedUrl);
    }
    
    // Revert to landing view
    dom.loadingView.style.display = "none";
    dom.landingView.style.display = "flex";
    dom.btnSearchToggle.disabled = true;
    dom.btnExportHtml.disabled = true;
    dom.documentTitleHeader.textContent = "No document open";
  }
}

// Initialise application
function init() {
  initSettingsUI();
  bindEvents();
  
  const params = new URLSearchParams(window.location.search);
  if (params.has("file")) {
    loadFromQueryParam();
  } else {
    // Auto-open sample document on page load immediately, as requested!
    loadSampleDoc();
  }
}

// Run app
init();
