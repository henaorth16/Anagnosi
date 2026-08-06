/**
 * Parser dispatcher.
 *
 * Each format is a separate module that is dynamically imported only when
 * actually needed, keeping the initial bundle lean.
 */

import type { SupportedFormat } from "../shared/fileTypes";

export interface ParseResult {
  html: string;
  warnings: string[];
}

/**
 * Parse an ArrayBuffer according to the given format.
 * The underlying parser module is loaded lazily on first use.
 */
export async function parseFile(
  arrayBuffer: ArrayBuffer,
  format: SupportedFormat,
): Promise<ParseResult> {
  switch (format) {
    case "docx": {
      const { parseDocx } = await import("./parseDocx");
      return parseDocx(arrayBuffer);
    }
    case "xlsx": {
      const { parseXlsx } = await import("./parseXlsx");
      return parseXlsx(arrayBuffer);
    }
    case "pptx": {
      const { parsePptx } = await import("./parsePptx");
      return parsePptx(arrayBuffer);
    }
    case "rtf": {
      const { parseRtf } = await import("./parseRtf");
      return parseRtf(arrayBuffer);
    }
    default: {
      const _exhaustive: never = format;
      throw new Error(`Unsupported format: ${_exhaustive}`);
    }
  }
}
