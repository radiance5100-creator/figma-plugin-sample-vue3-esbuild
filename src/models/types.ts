/**
 * @file: types.ts
 * @description: Базовые типы и интерфейсы для доменных моделей PPTX
 * @dependencies: Нет
 * @created: 2024-12-19
 */

// Базовые типы для позиционирования и размеров
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Цветовые типы
export interface RGBColor {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export interface RGBAColor extends RGBColor {
  a: number; // 0-1
}

export type Color = RGBColor | RGBAColor;

// Типы для стилей
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: Color;
  opacity: number; // 0-1
}

export interface ParagraphStyle {
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  textIndent: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export interface FillStyle {
  type: 'none' | 'solid' | 'gradient' | 'image';
  color?: Color;
  opacity?: number;
  gradientStops?: GradientStop[];
  imageUrl?: string;
}

export interface StrokeStyle {
  type: 'none' | 'solid' | 'dashed' | 'dotted';
  color: Color;
  width: number;
  opacity: number;
  cap: 'round' | 'square' | 'butt';
  join: 'round' | 'miter' | 'bevel';
}

export interface GradientStop {
  position: number; // 0-100
  color: Color;
}

// Эффекты
export interface ShadowEffect {
  enabled: boolean;
  color: Color;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface GlowEffect {
  enabled: boolean;
  color: Color;
  radius: number;
  opacity: number;
}

// Базовый интерфейс для всех элементов
export interface BaseElement {
  id: string;
  type: string;
  name?: string;
  position: Point;
  size: Size;
  rotation: number; // в градусах
  opacity: number; // 0-1
  visible: boolean;
  locked: boolean;
}

// Типы для гиперссылок
export interface Hyperlink {
  url: string;
  tooltip?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

// Типы для текстовых элементов
export interface TextRun {
  id: string;
  text: string;
  style: TextStyle;
  startIndex: number;
  endIndex: number;
  hyperlink?: Hyperlink;
}

export interface Paragraph {
  id: string;
  runs: TextRun[];
  style: ParagraphStyle;
  bulletType?: 'none' | 'bullet' | 'number';
  bulletLevel?: number;
  bulletText?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  paragraphs: Paragraph[];
  autoFit: boolean;
  wordWrap: boolean;
  verticalAlignment: 'top' | 'middle' | 'bottom';
}

// Типы для фигур
export type ShapeType = 
  | 'rectangle' 
  | 'ellipse' 
  | 'triangle' 
  | 'line' 
  | 'arrow' 
  | 'star' 
  | 'polygon' 
  | 'freeform';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fill: FillStyle;
  stroke: StrokeStyle;
  cornerRadius?: number; // для прямоугольников
  points?: Point[]; // для полигонов и свободных форм
}

// Типы для изображений
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  altText?: string;
  crop?: Rectangle;
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
}

// Типы для групп
export interface GroupElement extends BaseElement {
  type: 'group';
  children: Element[];
  expanded: boolean;
}

// Типы для линий и стрелок
export interface LineElement extends BaseElement {
  type: 'line';
  startPoint: Point;
  endPoint: Point;
  stroke: StrokeStyle;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  arrowSize?: number;
}

// Объединенный тип для всех элементов
export type Element = TextElement | ShapeElement | ImageElement | GroupElement | LineElement;

// Типы для слайдов
export interface SlideBackground {
  type: 'none' | 'solid' | 'gradient' | 'image';
  color?: Color;
  gradientStops?: GradientStop[];
  imageUrl?: string;
  opacity: number;
}

export interface Slide {
  id: string;
  name: string;
  number: number;
  elements: Element[];
  background: SlideBackground;
  size: Size;
  masterSlideId?: string;
  layoutId?: string;
}

// Типы для мастер-слайдов
export interface MasterSlide {
  id: string;
  name: string;
  number: number;
  elements: Element[];
  background: SlideBackground;
  layouts: SlideLayout[];
}

export interface SlideLayout {
  id: string;
  name: string;
  number: number;
  elements: Element[];
  background: SlideBackground;
  size: Size;
}

// Типы для цветовой информации
export interface ColorInfo {
  type: 'rgb' | 'scheme' | 'system';
  value: string;
  tint: number; // 0-1
  shade: number; // 0-1
  alpha: number; // 0-1
}

// Типы для информации о шрифте
export interface FontInfo {
  typeface: string;
  panose: string;
  pitchFamily: string;
  charset: string;
}

// Типы для тем
export interface ColorScheme {
  id: string;
  name: string;
  colors: { [key: string]: ColorInfo };
  metadata: {
    created: string;
    version: string;
  };
}

export interface FontScheme {
  id: string;
  name: string;
  fonts: {
    majorFont: {
      latin: FontInfo;
      eastAsian: FontInfo;
      complexScript: FontInfo;
    };
    minorFont: {
      latin: FontInfo;
      eastAsian: FontInfo;
      complexScript: FontInfo;
    };
  };
  metadata: {
    created: string;
    version: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  number: number;
  colors: ColorScheme;
  fonts: FontScheme;
  metadata: {
    created: string;
    modified: string;
    version: string;
  };
}

// Типы для медиа файлов
export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  src: string;
  size: number;
  mimeType: string;
  data?: ArrayBuffer;
}

// Типы для презентации
export interface Presentation {
  fileName: string;
  fileSize: number;
  slides: Slide[];
  masterSlides: MasterSlide[];
  themes: Theme[];
  media: MediaFile[];
  slideCount: number;
  masterCount: number;
  themeCount: number;
  slideSize: Size;
}

// Типы для результатов парсинга
export interface ParseResult {
  success: boolean;
  data?: Presentation;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

// Типы для прогресса
export interface ParseProgress {
  stage: 'initializing' | 'loading' | 'parsing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  currentSlide?: number;
  totalSlides?: number;
}
