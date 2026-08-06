import type { SupportedFormat } from "../shared/fileTypes";

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
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
  currentFormat: SupportedFormat | null;
}

export const state: AppState = {
  theme:
    (localStorage.getItem("anagnosi-theme") as AppState["theme"]) || "light",
  fontFamily:
    (localStorage.getItem("anagnosi-font-family") as AppState["fontFamily"]) ||
    "font-serif",
  fontSize: parseInt(localStorage.getItem("anagnosi-font-size") || "18"),
  lineHeight: parseFloat(localStorage.getItem("anagnosi-line-height") || "1.6"),
  pageWidth:
    (localStorage.getItem("anagnosi-page-width") as AppState["pageWidth"]) ||
    "width-standard",
  sidebarOpen: localStorage.getItem("anagnosi-sidebar-open") !== "false",
  activeTab: "outline",
  fileName: "",
  fileSize: "",
  wordCount: 0,
  readingTime: 0,
  currentFormat: null,
};

// ─── Search State ─────────────────────────────────────────────────────────────

export let searchMatches: HTMLElement[] = [];
export let currentSearchIndex = -1;

export function setSearchMatches(matches: HTMLElement[]) {
  searchMatches = matches;
}

export function setCurrentSearchIndex(index: number) {
  currentSearchIndex = index;
}
