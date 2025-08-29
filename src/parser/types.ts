/**
 * @file: types.ts
 * @description: Типы для PPTX данных и парсера
 * @dependencies: Нет
 * @created: 2024-12-19
 */

// Базовые типы PPTX
export interface PPTXFile {
  fileName: string
  fileSize: number
  slides: Slide[]
  masters: MasterSlide[]
  themes: Theme[]
  media: MediaFile[]
  presentation: PresentationInfo
}

export interface PresentationInfo {
  slideSize: {
    width: number
    height: number
  }
  slideCount: number
  masterCount: number
  themeCount: number
}

// Слайды
export interface Slide {
  id: string
  name: string
  number: number
  elements: SlideElement[]
  background?: Background
  masterSlideId?: string
  layout?: string
}

export interface MasterSlide {
  id: string
  name: string
  elements: SlideElement[]
  background?: Background
  layouts: Layout[]
}

export interface Layout {
  id: string
  name: string
  elements: SlideElement[]
}

// Элементы слайда
export interface SlideElement {
  id: string
  type: 'text' | 'shape' | 'image' | 'group'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  data: TextElement | ShapeElement | ImageElement | GroupElement
}

export interface TextElement {
  type: 'text'
  content: string
  paragraphs: Paragraph[]
  fontFamily?: string
  fontSize?: number
  color?: Color
  alignment?: 'left' | 'center' | 'right' | 'justify'
}

export interface Paragraph {
  runs: TextRun[]
  alignment?: 'left' | 'center' | 'right' | 'justify'
  lineSpacing?: number
  indent?: number
}

export interface TextRun {
  text: string
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: Color
}

export interface ShapeElement {
  type: 'shape'
  shapeType: 'rectangle' | 'ellipse' | 'triangle' | 'line' | 'arrow' | 'star' | 'polygon'
  fill?: Fill
  stroke?: Stroke
  text?: TextElement
}

export interface ImageElement {
  type: 'image'
  src: string
  alt?: string
  crop?: {
    left: number
    top: number
    right: number
    bottom: number
  }
  brightness?: number
  contrast?: number
}

export interface GroupElement {
  type: 'group'
  elements: SlideElement[]
}

// Стили
export interface Background {
  type: 'solid' | 'gradient' | 'image'
  color?: Color
  gradient?: Gradient
  image?: string
}

export interface Fill {
  type: 'solid' | 'gradient' | 'image' | 'none'
  color?: Color
  gradient?: Gradient
  image?: string
  opacity?: number
}

export interface Stroke {
  color: Color
  width: number
  style: 'solid' | 'dashed' | 'dotted'
  opacity?: number
}

export interface Color {
  r: number
  g: number
  b: number
  a?: number
}

export interface Gradient {
  type: 'linear' | 'radial'
  stops: GradientStop[]
  angle?: number
}

export interface GradientStop {
  position: number
  color: Color
}

// Темы
export interface Theme {
  id: string
  name: string
  colors: ColorScheme
  fonts: FontScheme
}

export interface ColorScheme {
  primary: Color[]
  accent: Color[]
  background: Color[]
  text: Color[]
}

export interface FontScheme {
  major: FontFamily
  minor: FontFamily
}

export interface FontFamily {
  name: string
  panose?: string
}

// Медиа файлы
export interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio'
  src: string
  size: number
  mimeType: string
}

// Единицы измерения
export interface EMU {
  value: number
  unit: 'emu'
}

export interface Point {
  value: number
  unit: 'pt'
}

export interface Pixel {
  value: number
  unit: 'px'
}

// Утилиты конвертации
export const EMU_TO_PIXELS = 96 / 914400 // 1 inch = 914400 EMU, 1 inch = 96 pixels
export const POINT_TO_PIXELS = 96 / 72 // 1 inch = 72 points, 1 inch = 96 pixels

// Результаты парсинга
export interface ParseResult {
  success: boolean
  data?: PPTXFile
  errors: string[]
  warnings: string[]
  processingTime: number
}

// Состояние парсера
export interface ParserState {
  isParsing: boolean
  progress: number
  currentStep: string
  errors: string[]
  warnings: string[]
}
