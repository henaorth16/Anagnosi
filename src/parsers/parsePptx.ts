/**
 * PPTX parser — lazy-loaded via dynamic import.
 *
 * A PPTX file is a ZIP archive (Office Open XML). We use JSZip (already a
 * transitive dependency of mammoth) to unzip it, then walk the slide XML files
 * and extract text runs, shapes, and titles — rendering each slide as a styled
 * HTML card.  No server required; runs entirely in the browser.
 */

export interface ParseResult {
  html: string;
  warnings: string[];
}

// ─── XML helpers ────────────────────────────────────────────────────────────

/** Extract all text from every <a:t> element inside an XML string. */
function extractTextRuns(xml: string): string[] {
  const runs: string[] = [];
  const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const t = m[1].trim();
    if (t) runs.push(decodeXmlEntities(t));
  }
  return runs;
}

/** Decode the five predefined XML character entities. */
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Shape extraction ────────────────────────────────────────────────────────

interface Shape {
  isTitle: boolean;
  paragraphs: string[];
}

/**
 * Parse all <p:sp> shapes from slide XML.
 * Titles are identified by placeholder type="title" or type="ctrTitle".
 */
function extractShapes(xml: string): Shape[] {
  const shapes: Shape[] = [];

  // Match each <p:sp>…</p:sp> block
  const spRe = /<p:sp[ >]([\s\S]*?)<\/p:sp>/g;
  let spMatch: RegExpExecArray | null;

  while ((spMatch = spRe.exec(xml)) !== null) {
    const block = spMatch[0];

    const isTitle = /type="(?:title|ctrTitle)"/.test(block);

    // Each <a:p> is a paragraph
    const paraRe = /<a:p[ >]([\s\S]*?)<\/a:p>/g;
    const paragraphs: string[] = [];
    let paraMatch: RegExpExecArray | null;

    while ((paraMatch = paraRe.exec(block)) !== null) {
      const runs = extractTextRuns(paraMatch[0]);
      const line = runs.join(" ").trim();
      if (line) paragraphs.push(line);
    }

    if (paragraphs.length > 0) {
      shapes.push({ isTitle, paragraphs });
    }
  }

  return shapes;
}

// ─── Slide rendering ─────────────────────────────────────────────────────────

function renderSlide(index: number, xml: string): string {
  const shapes = extractShapes(xml);

  if (shapes.length === 0) {
    return `
      <div class="pptx-slide pptx-slide--empty">
        <span class="pptx-slide-number">Slide ${index + 1}</span>
        <p class="pptx-slide-empty-label">No text content</p>
      </div>`;
  }

  const titleShape = shapes.find((s) => s.isTitle);
  const bodyShapes = shapes.filter((s) => !s.isTitle);

  const titleHtml = titleShape
    ? `<h2 class="pptx-slide-title">${escapeHtml(titleShape.paragraphs.join(" "))}</h2>`
    : "";

  const bodyHtml = bodyShapes
    .map((shape) =>
      shape.paragraphs
        .map((p) => `<p class="pptx-slide-para">${escapeHtml(p)}</p>`)
        .join(""),
    )
    .join("");

  return `
    <div class="pptx-slide">
      <span class="pptx-slide-number">Slide ${index + 1}</span>
      ${titleHtml}
      <div class="pptx-slide-body">${bodyHtml}</div>
    </div>`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function parsePptx(
  arrayBuffer: ArrayBuffer,
): Promise<ParseResult> {
  // Dynamic import: JSZip is only loaded when a .pptx file is opened.
  // JSZip is already present as a transitive dep of mammoth — no extra install.
  const JSZip = (await import("jszip")).default;

  const zip = await JSZip.loadAsync(arrayBuffer);

  // Collect slide XML files in presentation order (ppt/slides/slide1.xml, …)
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)![0]);
      const numB = parseInt(b.match(/\d+/)![0]);
      return numA - numB;
    });

  if (slideEntries.length === 0) {
    return {
      html: "<p>No slides found in this presentation.</p>",
      warnings: [],
    };
  }

  const slideHtmlParts: string[] = [];

  for (let i = 0; i < slideEntries.length; i++) {
    const xml = await zip.files[slideEntries[i]].async("string");
    slideHtmlParts.push(renderSlide(i, xml));
  }

  const html = `<div class="pptx-deck">${slideHtmlParts.join("\n")}</div>`;
  return { html, warnings: [] };
}
