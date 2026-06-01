/**
 * Runtime browser helpers shared by the web app and extension UI.
 * Does not import webextension-polyfill so the Vercel web build stays lean.
 */

export function isExtensionContext(): boolean {
  const runtime =
    (globalThis as { browser?: { runtime?: { id?: string } } }).browser?.runtime ??
    (globalThis as { chrome?: { runtime?: { id?: string } } }).chrome?.runtime

  return Boolean(runtime?.id)
}

/** True when running in Mozilla Firefox (extension or plain web). */
export function isFirefox(): boolean {
  const runtime =
    (globalThis as { browser?: { runtime?: { getBrowserInfo?: () => unknown } } }).browser
      ?.runtime ??
    (globalThis as { chrome?: { runtime?: { getBrowserInfo?: () => unknown } } }).chrome?.runtime

  if (runtime && typeof runtime.getBrowserInfo === 'function') {
    return true
  }

  return (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.includes('Firefox') &&
    !navigator.userAgent.includes('Seamonkey')
  )
}

export function isFileUrl(url: string): boolean {
  return url.startsWith('file://')
}

/** Extract a .docx filename from a file:// or http(s) URL path. */
export function fileNameFromUrl(url: string, fallback = 'document.docx'): string {
  try {
    const urlObj = new URL(url)
    const lastPart = urlObj.pathname.split('/').filter(Boolean).pop()
    if (lastPart?.toLowerCase().endsWith('.docx')) {
      return decodeURIComponent(lastPart)
    }
  } catch {
    // Malformed URL — use fallback
  }
  return fallback
}
