/**
 * XLSX parser — lazy-loaded via dynamic import.
 * Uses SheetJS (xlsx) to render each worksheet as an HTML table.
 */

export interface ParseResult {
  html: string;
  warnings: string[];
}

export async function parseXlsx(
  arrayBuffer: ArrayBuffer,
): Promise<ParseResult> {
  // Dynamic import: xlsx (~900 KB) is only loaded when a .xlsx file is opened
  const XLSX = await import("xlsx");

  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const parts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    // sheet_to_html produces a full <table> element
    const tableHtml = XLSX.utils.sheet_to_html(sheet, {
      id: `sheet-${sheetName}`,
    });

    parts.push(`
      <section class="xlsx-sheet">
        <h2 class="xlsx-sheet-title">${escapeHtml(sheetName)}</h2>
        <div class="xlsx-table-wrapper">${tableHtml}</div>
      </section>
    `);
  }

  return {
    html: parts.join("\n"),
    warnings: [],
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
