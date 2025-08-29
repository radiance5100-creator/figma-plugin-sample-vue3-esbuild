/**
 * @file: factories.ts
 * @description: Фабрики для создания доменных объектов
 * @dependencies: types.ts
 * @created: 2024-12-19
 */

import {
  Point,
  Size,
  Rectangle,
  Color,
  RGBColor,
  TextStyle,
  ParagraphStyle,
  FillStyle,
  StrokeStyle,
  TextRun,
  Paragraph,
  TextElement,
  ShapeElement,
  ImageElement,
  GroupElement,
  LineElement,
  Element,
  SlideBackground,
  Slide,
  MasterSlide,
  SlideLayout,
  Theme,
  MediaFile,
  Presentation,
  ParseResult,
  ParseProgress
} from './types';

// Утилиты для создания базовых объектов
export class ModelFactories {
  
  // Создание точки
  static createPoint(x: number, y: number): Point {
    return { x, y };
  }

  // Создание размера
  static createSize(width: number, height: number): Size {
    return { width, height };
  }

  // Создание прямоугольника
  static createRectangle(x: number, y: number, width: number, height: number): Rectangle {
    return { x, y, width, height };
  }

  // Создание цвета RGB
  static createRGBColor(r: number, g: number, b: number): RGBColor {
    return { r: Math.max(0, Math.min(1, r)), g: Math.max(0, Math.min(1, g)), b: Math.max(0, Math.min(1, b)) };
  }

  // Создание цвета из hex строки
  static createColorFromHex(hex: string): RGBColor {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    return this.createRGBColor(r, g, b);
  }

  // Создание стиля текста
  static createTextStyle(overrides: Partial<TextStyle> = {}): TextStyle {
    return {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: this.createRGBColor(0, 0, 0),
      opacity: 1,
      ...overrides
    };
  }

  // Создание стиля абзаца
  static createParagraphStyle(overrides: Partial<ParagraphStyle> = {}): ParagraphStyle {
    return {
      alignment: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      textIndent: 0,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      ...overrides
    };
  }

  // Создание стиля заливки
  static createFillStyle(overrides: Partial<FillStyle> = {}): FillStyle {
    return {
      type: 'none',
      color: this.createRGBColor(0, 0, 0),
      opacity: 1,
      ...overrides
    };
  }

  // Создание стиля обводки
  static createStrokeStyle(overrides: Partial<StrokeStyle> = {}): StrokeStyle {
    return {
      type: 'none',
      color: this.createRGBColor(0, 0, 0),
      width: 1,
      opacity: 1,
      cap: 'round',
      join: 'round',
      ...overrides
    };
  }

  // Создание текстового run
  static createTextRun(text: string, style?: Partial<TextStyle>, startIndex = 0): TextRun {
    return {
      id: `run-${Date.now()}-${Math.random()}`,
      text,
      style: this.createTextStyle(style),
      startIndex,
      endIndex: startIndex + text.length
    };
  }

  // Создание абзаца
  static createParagraph(runs: TextRun[] = [], style?: Partial<ParagraphStyle>): Paragraph {
    return {
      id: `paragraph-${Date.now()}-${Math.random()}`,
      runs,
      style: this.createParagraphStyle(style),
      bulletType: 'none'
    };
  }

  // Создание текстового элемента
  static createTextElement(
    position: Point,
    size: Size,
    paragraphs: Paragraph[] = [],
    overrides: Partial<TextElement> = {}
  ): TextElement {
    return {
      id: `text-${Date.now()}-${Math.random()}`,
      type: 'text',
      name: 'Text',
      position,
      size,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      paragraphs,
      autoFit: false,
      wordWrap: true,
      verticalAlignment: 'top',
      ...overrides
    };
  }

  // Создание фигуры
  static createShapeElement(
    position: Point,
    size: Size,
    shapeType: ShapeElement['shapeType'],
    overrides: Partial<ShapeElement> = {}
  ): ShapeElement {
    return {
      id: `shape-${Date.now()}-${Math.random()}`,
      type: 'shape',
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`,
      position,
      size,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      shapeType,
      fill: this.createFillStyle(),
      stroke: this.createStrokeStyle(),
      ...overrides
    };
  }

  // Создание изображения
  static createImageElement(
    position: Point,
    size: Size,
    src: string,
    overrides: Partial<ImageElement> = {}
  ): ImageElement {
    return {
      id: `image-${Date.now()}-${Math.random()}`,
      type: 'image',
      name: 'Image',
      position,
      size,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      src,
      altText: '',
      ...overrides
    };
  }

  // Создание группы
  static createGroupElement(
    position: Point,
    size: Size,
    children: Element[] = [],
    overrides: Partial<GroupElement> = {}
  ): GroupElement {
    return {
      id: `group-${Date.now()}-${Math.random()}`,
      type: 'group',
      name: 'Group',
      position,
      size,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      children,
      expanded: true,
      ...overrides
    };
  }

  // Создание линии
  static createLineElement(
    startPoint: Point,
    endPoint: Point,
    overrides: Partial<LineElement> = {}
  ): LineElement {
    const position = this.createPoint(Math.min(startPoint.x, endPoint.x), Math.min(startPoint.y, endPoint.y));
    const size = this.createSize(
      Math.abs(endPoint.x - startPoint.x),
      Math.abs(endPoint.y - startPoint.y)
    );

    return {
      id: `line-${Date.now()}-${Math.random()}`,
      type: 'line',
      name: 'Line',
      position,
      size,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      startPoint,
      endPoint,
      stroke: this.createStrokeStyle({ type: 'solid' }),
      ...overrides
    };
  }

  // Создание фона слайда
  static createSlideBackground(overrides: Partial<SlideBackground> = {}): SlideBackground {
    return {
      type: 'none',
      opacity: 1,
      ...overrides
    };
  }

  // Создание слайда
  static createSlide(
    number: number,
    elements: Element[] = [],
    overrides: Partial<Slide> = {}
  ): Slide {
    return {
      id: `slide-${number}`,
      name: `Slide ${number}`,
      number,
      elements,
      background: this.createSlideBackground(),
      size: this.createSize(9144000, 6858000), // Стандартный размер PPTX в EMU
      ...overrides
    };
  }

  // Создание мастер-слайда
  static createMasterSlide(
    number: number,
    elements: Element[] = [],
    layouts: SlideLayout[] = [],
    overrides: Partial<MasterSlide> = {}
  ): MasterSlide {
    return {
      id: `master-${number}`,
      name: `Master ${number}`,
      number,
      elements,
      background: this.createSlideBackground(),
      layouts,
      ...overrides
    };
  }

  // Создание макета слайда
  static createSlideLayout(
    number: number,
    elements: Element[] = [],
    overrides: Partial<SlideLayout> = {}
  ): SlideLayout {
    return {
      id: `layout-${number}`,
      name: `Layout ${number}`,
      number,
      elements,
      background: this.createSlideBackground(),
      size: this.createSize(9144000, 6858000),
      ...overrides
    };
  }

  // Создание темы
  static createTheme(
    number: number,
    overrides: Partial<Theme> = {}
  ): Theme {
    return {
      id: `theme-${number}`,
      name: `Theme ${number}`,
      number,
      colorScheme: {
        primary: this.createRGBColor(0, 0, 0),
        secondary: this.createRGBColor(1, 1, 1),
        accent1: this.createRGBColor(0.2, 0.4, 0.8),
        accent2: this.createRGBColor(0.8, 0.2, 0.2),
        accent3: this.createRGBColor(0.2, 0.8, 0.2),
        accent4: this.createRGBColor(0.8, 0.8, 0.2),
        accent5: this.createRGBColor(0.8, 0.2, 0.8),
        accent6: this.createRGBColor(0.2, 0.8, 0.8),
        hyperlink: this.createRGBColor(0, 0, 1),
        followedHyperlink: this.createRGBColor(0.5, 0, 0.5)
      },
      fontScheme: {
        major: {
          latin: 'Arial',
          eastAsian: 'Arial',
          complex: 'Arial'
        },
        minor: {
          latin: 'Arial',
          eastAsian: 'Arial',
          complex: 'Arial'
        }
      },
      ...overrides
    };
  }

  // Создание медиа файла
  static createMediaFile(
    name: string,
    type: MediaFile['type'],
    src: string,
    size: number,
    mimeType: string,
    overrides: Partial<MediaFile> = {}
  ): MediaFile {
    return {
      id: `media-${Date.now()}-${Math.random()}`,
      name,
      type,
      src,
      size,
      mimeType,
      ...overrides
    };
  }

  // Создание презентации
  static createPresentation(
    fileName: string,
    fileSize: number,
    slides: Slide[] = [],
    overrides: Partial<Presentation> = {}
  ): Presentation {
    return {
      fileName,
      fileSize,
      slides,
      masterSlides: [],
      themes: [],
      media: [],
      slideCount: slides.length,
      masterCount: 0,
      themeCount: 0,
      slideSize: this.createSize(9144000, 6858000),
      ...overrides
    };
  }

  // Создание результата парсинга
  static createParseResult(
    success: boolean,
    data?: Presentation,
    errors: string[] = [],
    warnings: string[] = [],
    processingTime = 0
  ): ParseResult {
    return {
      success,
      data,
      errors,
      warnings,
      processingTime
    };
  }

  // Создание прогресса парсинга
  static createParseProgress(
    stage: ParseProgress['stage'],
    progress: number,
    message: string,
    currentSlide?: number,
    totalSlides?: number
  ): ParseProgress {
    return {
      stage,
      progress: Math.max(0, Math.min(100, progress)),
      message,
      currentSlide,
      totalSlides
    };
  }
}
