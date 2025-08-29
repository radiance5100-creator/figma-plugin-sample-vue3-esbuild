/**
 * @file: types.ts
 * @description: Общие типы для сообщений между UI и main процессом
 * @dependencies: Нет
 * @created: 2024-12-19
 */

// Типы сообщений от UI к main процессу
export interface UIMessage {
  type: 'import-pptx' | 'cancel' | 'update-progress'
  payload?: any
}

export interface ImportPPTXMessage extends UIMessage {
  type: 'import-pptx'
  payload: {
    fileName: string
    fileData: ArrayBuffer
    settings: ImportSettings
  }
}

export interface UpdateProgressMessage extends UIMessage {
  type: 'update-progress'
  payload: {
    progress: number
    currentStep: string
    message?: string
  }
}

export interface CancelMessage extends UIMessage {
  type: 'cancel'
}

// Типы сообщений от main процесса к UI
export interface MainMessage {
  type: 'import-started' | 'import-progress' | 'import-complete' | 'import-error' | 'notification'
  payload?: any
}

export interface ImportStartedMessage extends MainMessage {
  type: 'import-started'
  payload: {
    totalSlides: number
  }
}

export interface ImportProgressMessage extends MainMessage {
  type: 'import-progress'
  payload: {
    progress: number
    currentStep: string
    currentSlide: number
    totalSlides: number
  }
}

export interface ImportCompleteMessage extends MainMessage {
  type: 'import-complete'
  payload: {
    slidesImported: number
    warnings: string[]
    errors: string[]
  }
}

export interface ImportErrorMessage extends MainMessage {
  type: 'import-error'
  payload: {
    error: string
    details?: string
  }
}

export interface NotificationMessage extends MainMessage {
  type: 'notification'
  payload: {
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }
}

// Настройки импорта
export interface ImportSettings {
  includeMasterBackground: boolean
  importImages: boolean
  importShapes: boolean
  importText: boolean
  slideSize: '1920x1080' | '1280x720' | 'custom'
  customWidth?: number
  customHeight?: number
}

// Результаты импорта
export interface ImportResult {
  slidesImported: number
  warnings: string[]
  errors: string[]
  totalSlides: number
  processingTime: number
}

// Состояние импорта
export interface ImportState {
  isImporting: boolean
  progress: number
  currentStep: string
  currentSlide: number
  totalSlides: number
  results: ImportResult
}

// Валидация файлов
export interface FileValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileSize: number
  fileName: string
  fileType: string
}

// Прогресс парсинга для UI
export interface ParseProgress {
  stage: 'initializing' | 'loading' | 'parsing' | 'completed' | 'error'
  progress: number
  message: string
}

// Информация о презентации
export interface PresentationInfo {
  slideCount: number
  masterCount: number
  themeCount: number
  slideSize: {
    width: number
    height: number
  }
}

// PPTX данные
export interface PPTXData {
  fileName: string
  fileSize: number
  slides: Slide[]
  masters: MasterSlide[]
  themes: Theme[]
  media: MediaFile[]
  presentation: PresentationInfo
}

// Импорт доменных моделей для совместимости
export { 
  Presentation,
  Slide as DomainSlide,
  Element,
  TextElement,
  ShapeElement,
  ImageElement,
  GroupElement,
  LineElement
} from '../models'

// Слайд
export interface Slide {
  id: string
  name: string
  number: number
  elements: any[]
  background: any
  layout: any
}

// Мастер-слайд
export interface MasterSlide {
  id: string
  name: string
  number: number
  elements: any[]
  layouts: any[]
}

// Тема
export interface Theme {
  id: string
  name: string
  number: number
  colors: any
  fonts: any
}

// Медиа файл
export interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio'
  src: string
  size: number
  data?: Uint8Array
  mimeType: string
}

// Результат парсинга
export interface ParseResult {
  success: boolean
  data?: PPTXData
  errors: string[]
  warnings: string[]
  processingTime: number
}
