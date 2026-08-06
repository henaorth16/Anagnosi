/**
 * RTF parser — lazy-loaded via dynamic import.
 *
 * RTF is a plain-text format with control words (e.g. \b, \i, \par).
 * This pure-JS implementation covers the most common formatting used in
 * real-world RTF files without any native dependencies, keeping the bundle
 * lean and fully browser-compatible.
 *
 * Supported:
 *  - Bold (\b), italic (\i), underline (\ul / \ulnone)
 *  - Paragraphs (\par, \pard), line breaks (\line)
 *  - Unicode characters (\uN), hex escapes (\'hh)
 *  - Basic heading detection via font-size control words (\fsN)
 *  - Tables (\trowd, \row, \cell, \intbl) — renders as <table>
 *  - Hyperlinks (\field … \fldinst HYPERLINK … \fldrslt …)
 *  - Nested groups via brace counting
 */

export interface ParseResult {
  html: string;
  warnings: string[];
}

// ─── Tokeniser ───────────────────────────────────────────────────────────────

type Token =
  | { kind: "open" } // {
  | { kind: "close" } // }
  | { kind: "ctrl"; word: string; param: number | null } // \word or \word123
  | { kind: "text"; value: string } // literal characters
  | { kind: "hex"; code: number }; // \'hh

function tokenise(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];

    if (ch === "{") {
      tokens.push({ kind: "open" });
      i++;
      continue;
    }

    if (ch === "}") {
      tokens.push({ kind: "close" });
      i++;
      continue;
    }

    if (ch === "\\") {
      i++;
      if (i >= len) break;
      const next = src[i];

      // Hex escape  \'hh
      if (next === "'") {
        i++;
        const hex = src.slice(i, i + 2);
        i += 2;
        tokens.push({ kind: "hex", code: parseInt(hex, 16) || 0 });
        continue;
      }

      // Literal escaped characters  \\ \{ \}  \- \~ \|  \:  \* \;
      if ("{}\\-~|:*;".includes(next)) {
        tokens.push({ kind: "text", value: next === "-" ? "\u00ad" : next });
        i++;
        continue;
      }

      // Control symbol (single non-alpha char)
      if (!/[a-zA-Z]/.test(next)) {
        tokens.push({ kind: "ctrl", word: next, param: null });
        i++;
        continue;
      }

      // Control word  \word[-]?[digits]?[ ]?
      let word = "";
      while (i < len && /[a-zA-Z]/.test(src[i])) {
        word += src[i++];
      }

      let param: number | null = null;
      let negative = false;
      if (i < len && src[i] === "-") {
        negative = true;
        i++;
      }
      if (i < len && /\d/.test(src[i])) {
        let numStr = "";
        while (i < len && /\d/.test(src[i])) numStr += src[i++];
        param = parseInt(numStr, 10) * (negative ? -1 : 1);
      }

      // Consume optional trailing space delimiter (part of RTF spec)
      if (i < len && src[i] === " ") i++;

      tokens.push({ kind: "ctrl", word, param });
      continue;
    }

    // Regular text — gather a run of non-special characters
    let text = "";
    while (i < len && src[i] !== "{" && src[i] !== "}" && src[i] !== "\\") {
      text += src[i++];
    }
    if (text) tokens.push({ kind: "text", value: text });
  }

  return tokens;
}

// ─── Renderer state ──────────────────────────────────────────────────────────

interface State {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  /** Half-points (RTF \fs unit); default Word body text is 24 (12pt) */
  fontSize: number;
  /** True while inside a {\*\... } destination we want to skip */
  skip: boolean;
  /** True when inside \pict, \objdata, binary blobs */
  binary: boolean;
  /** True when inside \info, \colortbl, \fonttbl etc. */
  inMeta: boolean;
  /** Tracks hyperlink URL being accumulated in \fldinst */
  hyperlinkUrl: string;
  /** True while we are inside a \fldrslt group (the visible link text) */
  inFldrslt: boolean;
  /** True while accumulating a \fldinst string */
  inFldinst: boolean;
  /** True while inside a table row */
  inTable: boolean;
  inRow: boolean;
  inCell: boolean;
}

function cloneState(s: State): State {
  return { ...s };
}

function defaultState(): State {
  return {
    bold: false,
    italic: false,
    underline: false,
    fontSize: 24,
    skip: false,
    binary: false,
    inMeta: false,
    hyperlinkUrl: "",
    inFldrslt: false,
    inFldinst: false,
    inTable: false,
    inRow: false,
    inCell: false,
  };
}

// ─── HTML builder ────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap inline text with active formatting tags. */
function wrapInline(text: string, state: State): string {
  if (!text) return "";
  let s = escapeHtml(text);
  if (state.bold) s = `<strong>${s}</strong>`;
  if (state.italic) s = `<em>${s}</em>`;
  if (state.underline) s = `<u>${s}</u>`;
  return s;
}

// ─── Main converter ──────────────────────────────────────────────────────────

export async function parseRtf(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
  const decoder = new TextDecoder("windows-1252");
  const src = decoder.decode(arrayBuffer);

  const tokens = tokenise(src);
  const warnings: string[] = [];

  // Stack of states for RTF group nesting
  const stack: State[] = [];
  let state = defaultState();

  // Output accumulator — we build paragraph-level HTML
  const paragraphs: string[] = []; // finished <p> or <tr> strings
  let inline = ""; // current inline run

  // Table accumulator
  const cells: string[] = []; // accumulated <td> content in current row
  const rows: string[] = []; // accumulated <tr> strings

  function flushInline() {
    if (inline.trim()) {
      // Detect headings by font size: >40 half-points (>20pt) = heading
      if (state.fontSize >= 48) {
        paragraphs.push(`<h1>${inline}</h1>`);
      } else if (state.fontSize >= 36) {
        paragraphs.push(`<h2>${inline}</h2>`);
      } else if (state.fontSize >= 28) {
        paragraphs.push(`<h3>${inline}</h3>`);
      } else {
        paragraphs.push(`<p>${inline}</p>`);
      }
    }
    inline = "";
  }

  function flushCell() {
    cells.push(`<td>${inline}</td>`);
    inline = "";
  }

  function flushRow() {
    if (cells.length > 0) {
      rows.push(`<tr>${cells.join("")}</tr>`);
      cells.length = 0;
    }
  }

  function flushTable() {
    if (rows.length > 0) {
      paragraphs.push(
        `<table class="rtf-table"><tbody>${rows.join("")}</tbody></table>`,
      );
      rows.length = 0;
    }
  }

  const META_DESTINATIONS = new Set([
    "fonttbl",
    "colortbl",
    "stylesheet",
    "info",
    "pict",
    "objdata",
    "themedata",
    "colorschememapping",
    "latentstyles",
    "datastore",
    "rsidtbl",
    "pgptbl",
    "xmlnstbl",
    "listpicture",
    "listtable",
    "listoverridetable",
    "revtbl",
  ]);

  for (const tok of tokens) {
    if (tok.kind === "open") {
      stack.push(cloneState(state));
      continue;
    }

    if (tok.kind === "close") {
      // Close a hyperlink fldrslt group
      if (state.inFldrslt && inline) {
        const url = state.hyperlinkUrl.trim();
        if (url) {
          inline = `<a href="${escapeHtml(url)}">${inline}</a>`;
        }
        state.inFldrslt = false;
      }

      // Restore parent state but carry through table context
      const wasInTable = state.inTable;
      state = stack.pop() ?? defaultState();
      if (wasInTable) state.inTable = true;
      continue;
    }

    // Skip destinations we don't understand
    if (state.skip || state.inMeta) {
      if (tok.kind === "ctrl" && META_DESTINATIONS.has(tok.word)) {
        state.inMeta = true;
      }
      continue;
    }

    if (tok.kind === "ctrl") {
      const { word, param } = tok;

      // ── Skip markers ──────────────────────────────────────────────────────
      if (word === "*") {
        // \* marks the next destination as optional/unknown — skip its group
        state.skip = true;
        continue;
      }

      if (META_DESTINATIONS.has(word)) {
        state.inMeta = true;
        continue;
      }

      // ── Formatting ────────────────────────────────────────────────────────
      if (word === "b") {
        state.bold = param !== 0;
        continue;
      }
      if (word === "i") {
        state.italic = param !== 0;
        continue;
      }
      if (word === "ul") {
        state.underline = true;
        continue;
      }
      if (word === "ulnone") {
        state.underline = false;
        continue;
      }
      if (word === "fs" && param !== null) {
        state.fontSize = param;
        continue;
      }

      // ── Paragraphs / breaks ───────────────────────────────────────────────
      if (word === "par" || word === "pard") {
        if (state.inTable && state.inCell) {
          // inside a cell — don't flush as a full paragraph
          inline += " ";
        } else {
          flushInline();
        }
        continue;
      }

      if (word === "line") {
        inline += "<br>";
        continue;
      }

      // ── Tables ────────────────────────────────────────────────────────────
      if (word === "trowd") {
        state.inTable = true;
        state.inRow = true;
        continue;
      }

      if (word === "intbl") {
        state.inTable = true;
        state.inCell = true;
        continue;
      }

      if (word === "cell") {
        flushCell();
        state.inCell = false;
        continue;
      }

      if (word === "row") {
        flushRow();
        state.inRow = false;
        state.inTable = false;
        continue;
      }

      // ── Hyperlinks ────────────────────────────────────────────────────────
      if (word === "field") {
        // A hyperlink field: {\field{\*\fldinst HYPERLINK "url"}{\fldrslt text}}
        // We handle this by detecting fldinst / fldrslt in child groups
        continue;
      }

      if (word === "fldinst") {
        state.inFldinst = true;
        state.hyperlinkUrl = "";
        continue;
      }

      if (word === "fldrslt") {
        state.inFldinst = false;
        state.inFldrslt = true;
        continue;
      }

      // ── Unicode ───────────────────────────────────────────────────────────
      if (word === "u" && param !== null) {
        // \uN — unicode codepoint, followed by one skip character
        const cp = param < 0 ? param + 65536 : param;
        inline += wrapInline(String.fromCodePoint(cp), state);
        // The next token (a \'hh fallback) should be skipped
        continue;
      }

      // ── Special chars ─────────────────────────────────────────────────────
      if (word === "tab") {
        inline += "&nbsp;&nbsp;&nbsp;&nbsp;";
        continue;
      }
      if (word === "emdash") {
        inline += "—";
        continue;
      }
      if (word === "endash") {
        inline += "–";
        continue;
      }
      if (word === "lquote") {
        inline += "\u2018";
        continue;
      }
      if (word === "rquote") {
        inline += "\u2019";
        continue;
      }
      if (word === "ldblquote") {
        inline += "\u201c";
        continue;
      }
      if (word === "rdblquote") {
        inline += "\u201d";
        continue;
      }
      if (word === "bullet") {
        inline += "•";
        continue;
      }

      // Ignore all other control words
      continue;
    }

    if (tok.kind === "hex") {
      const ch = String.fromCharCode(tok.code);
      if (state.inFldinst) {
        state.hyperlinkUrl += ch;
      } else {
        inline += wrapInline(ch, state);
      }
      continue;
    }

    if (tok.kind === "text") {
      const value = tok.value
        .replace(/\r\n|\r|\n/g, "") // RTF newlines are not paragraph breaks
        .replace(/\u0000/g, "");

      if (!value) continue;

      if (state.inFldinst) {
        // Strip surrounding quotes from the URL
        state.hyperlinkUrl += value.replace(/^["']|["']$/g, "");
      } else {
        inline += wrapInline(value, state);
      }
    }
  }

  // Flush any remaining inline content
  flushInline();
  flushTable();

  const html = paragraphs.filter((p) => p.trim()).join("\n");

  return {
    html: html || "<p>No readable text content found in this RTF file.</p>",
    warnings,
  };
}
