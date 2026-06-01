import browser from 'webextension-polyfill'
import { fileNameFromUrl, isFirefox } from '../shared/browser'

const READER_PAGE = 'index.html'

/**
 * When the user clicks the extension toolbar icon, open the Anagnosi reader in a
 * dedicated tab (or focus an already-open one).
 */
browser.action.onClicked.addListener(async () => {
  const readerUrl = browser.runtime.getURL(READER_PAGE)

  // Reuse an existing Anagnosi tab if one is already open
  const existing = await browser.tabs.query({ url: readerUrl })

  if (existing.length > 0 && existing[0].id !== undefined) {
    await browser.tabs.update(existing[0].id, { active: true })
    if (existing[0].windowId !== undefined) {
      await browser.windows.update(existing[0].windowId, { focused: true })
    }
  } else {
    await browser.tabs.create({ url: readerUrl })
  }
})

function readerUrlForDocxNavigation(docxUrl: string, readerUrl: string): string {
  // Firefox cannot fetch file:// URLs from extension pages; open the reader with
  // a local-file prompt instead of embedding the full path in ?file=.
  if (isFirefox() && docxUrl.startsWith('file://')) {
    const name = fileNameFromUrl(docxUrl)
    return `${readerUrl}?local=1&name=${encodeURIComponent(name)}`
  }

  return `${readerUrl}?file=${encodeURIComponent(docxUrl)}`
}

/**
 * Intercept navigation to any .docx file (local file:// or web http/https URL)
 * and redirect to Anagnosi DocX Reader.
 */
browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only intercept main frame navigations (ignoring sub-frames, iframes)
  if (details.frameId !== 0) return

  const url = details.url
  if (url && (url.toLowerCase().endsWith('.docx') || url.toLowerCase().includes('.docx?'))) {
    const readerUrl = browser.runtime.getURL(READER_PAGE)

    // Prevent infinite loop if navigating inside Anagnosi reader itself
    if (url.startsWith(readerUrl)) return

    const targetUrl = readerUrlForDocxNavigation(url, readerUrl)

    await browser.tabs.update(details.tabId, { url: targetUrl })
  }
})
