/**
 * Supported file format definitions.
 * Single source of truth for extensions, MIME types, and display labels.
 */

export type SupportedFormat = "docx" | "xlsx" | "pptx" | "rtf";

export interface FormatInfo {
  ext: SupportedFormat;
  label: string;
  mimeType: string;
  /** Human-readable description shown in the UI */
  description: string;
}

export const FORMAT_MAP: Record<SupportedFormat, FormatInfo> = {
  docx: {
    ext: "docx",
    label: "Word Document",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Microsoft Word (.docx)",
  },
  xlsx: {
    ext: "xlsx",
    label: "Excel Spreadsheet",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Microsoft Excel (.xlsx)",
  },
  pptx: {
    ext: "pptx",
    label: "PowerPoint Presentation",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    description: "Microsoft PowerPoint (.pptx)",
  },
  rtf: {
    ext: "rtf",
    label: "Rich Text Document",
    mimeType: "application/rtf",
    description: "Rich Text Format (.rtf)",
  },
};

export const SUPPORTED_EXTENSIONS: SupportedFormat[] = [
  "docx",
  "xlsx",
  "pptx",
  "rtf",
];

/** Returns the format for a given filename, or null if unsupported. */
export function detectFormat(fileName: string): SupportedFormat | null {
  const lower = fileName.toLowerCase();
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (lower.endsWith(`.${ext}`)) return ext;
  }
  return null;
}

/** Returns true if the URL path ends with a supported extension (with optional query string). */
export function isSupportedUrl(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`));
}

/** The accept string for <input type="file"> */
export const FILE_INPUT_ACCEPT = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(
  ",",
);
