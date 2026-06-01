export interface AppState {
  theme: 'light' | 'sepia' | 'dark' | 'oled'
  fontFamily: 'font-sans' | 'font-serif' | 'font-mono'
  fontSize: number
  lineHeight: number
  pageWidth: 'width-narrow' | 'width-standard' | 'width-wide'
  sidebarOpen: boolean
  activeTab: 'outline' | 'settings'
  fileName: string
  fileSize: string
  wordCount: number
  readingTime: number
}

export interface TocEntry {
  id: string
  text: string
  level: number
  element: HTMLElement
}

export interface ReadingStats {
  wordCount: number
  readingTime: number
}
