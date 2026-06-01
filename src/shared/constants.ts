export const APP_NAME = 'Anagnosi'
export const APP_VERSION = '1.0.0'
export const WORDS_PER_MINUTE = 225

export const STORAGE_KEYS = {
  THEME:        'anagnosi-theme',
  FONT_FAMILY:  'anagnosi-font-family',
  FONT_SIZE:    'anagnosi-font-size',
  LINE_HEIGHT:  'anagnosi-line-height',
  PAGE_WIDTH:   'anagnosi-page-width',
  SIDEBAR_OPEN: 'anagnosi-sidebar-open',
} as const

export const DEFAULT_STATE = {
  theme:       'light'          as const,
  fontFamily:  'font-serif'     as const,
  fontSize:    18,
  lineHeight:  1.6,
  pageWidth:   'width-standard' as const,
  sidebarOpen: true,
} as const
