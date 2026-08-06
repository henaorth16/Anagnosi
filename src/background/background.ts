import browser from "webextension-polyfill";
import { fileNameFromUrl, isFirefox } from "../shared/browser";
import { isSupportedUrl, detectFormat } from "../shared/fileTypes";

const READER_PAGE = "index.html";

/**
 * When the user clicks the extension toolbar icon, open the Anagnosi reader in a
 * dedicated tab (or focus an already-open one).
 */
browser.action.onClicked.addListener(async () => {
  const readerUrl = browser.runtime.getURL(READER_PAGE);

  const existing = await browser.tabs.query({ url: readerUrl });

  if (existing.length > 0 && existing[0].id !== undefined) {
    await browser.tabs.update(existing[0].id, { active: true });
    if (existing[0].windowId !== undefined) {
      await browser.windows.update(existing[0].windowId, { focused: true });
    }
  } else {
    await browser.tabs.create({ url: readerUrl });
  }
});

/**
 * Build the reader URL for a given document URL.
 *
 * Firefox cannot fetch file:// URLs from extension pages, so for local files
 * we redirect with ?local=1&name=<filename>&fmt=<format> and let the UI show
 * a "please pick the file" prompt instead.
 */
function readerUrlForDocument(docUrl: string, readerUrl: string): string {
  const format = detectFormat(docUrl.split("?")[0]) ?? "docx";

  if (isFirefox() && docUrl.startsWith("file://")) {
    const name = fileNameFromUrl(docUrl);
    return (
      `${readerUrl}?local=1` +
      `&name=${encodeURIComponent(name)}` +
      `&fmt=${format}`
    );
  }

  return `${readerUrl}?file=${encodeURIComponent(docUrl)}` + `&fmt=${format}`;
}

/**
 * Intercept navigation to any supported document file (local file:// or
 * web http/https) and redirect to the Anagnosi reader.
 *
 * Supported: .docx  .xlsx  .pptx  .rtf
 */
browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only intercept main-frame navigations
  if (details.frameId !== 0) return;

  const url = details.url;
  if (!url || !isSupportedUrl(url)) return;

  const readerUrl = browser.runtime.getURL(READER_PAGE);

  // Prevent infinite loop if the reader itself matches somehow
  if (url.startsWith(readerUrl)) return;

  const targetUrl = readerUrlForDocument(url, readerUrl);
  await browser.tabs.update(details.tabId, { url: targetUrl });
});
