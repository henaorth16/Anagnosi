import browser from 'webextension-polyfill'

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

    const targetUrl = `${readerUrl}?file=${encodeURIComponent(url)}`

    // Redirect the tab to our reader
    await browser.tabs.update(details.tabId, { url: targetUrl })
  }
})
