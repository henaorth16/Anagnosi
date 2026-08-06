/**
 * DOCX parser — lazy-loaded via dynamic import.
 * Uses mammoth to convert Word XML to clean HTML.
 */

export interface ParseResult {
  html: string;
  /** Any conversion warnings from the underlying library */
  warnings: string[];
}

export async function parseDocx(
  arrayBuffer: ArrayBuffer,
): Promise<ParseResult> {
  // Dynamic import: mammoth is only bundled when a .docx file is opened
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return {
    html: result.value,
    warnings: result.messages
      .filter((m) => m.type === "warning")
      .map((m) => m.message),
  };
}
