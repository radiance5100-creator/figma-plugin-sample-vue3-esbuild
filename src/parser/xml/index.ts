/**
 * @file: index.ts
 * @description: Главный файл экспорта XML парсеров
 * @dependencies: XMLParser, PresentationParser, SlideParser
 * @created: 2024-12-19
 */

// Экспорт базового XML парсера
export { XMLParser, XMLParseOptions } from './XMLParser'

// Экспорт парсеров для конкретных файлов
export { PresentationParser, PresentationInfo } from './PresentationParser'
export { SlideParser, SlideData } from './SlideParser'

// Экспорт утилит для работы с XML
export const XMLUtils = {
  // Константы для работы с PPTX XML
  NAMESPACES: {
    PRESENTATION: 'http://schemas.openxmlformats.org/presentationml/2006/main',
    DRAWING: 'http://schemas.openxmlformats.org/drawingml/2006/main',
    CHART: 'http://schemas.openxmlformats.org/drawingml/2006/chart',
    RELATIONSHIPS: 'http://schemas.openxmlformats.org/package/2006/relationships'
  },

  // Префиксы для элементов
  PREFIXES: {
    PRESENTATION: 'p',
    DRAWING: 'a',
    CHART: 'c',
    RELATIONSHIPS: 'r'
  },

  // Стандартные пути к файлам в PPTX
  PATHS: {
    PRESENTATION: 'ppt/presentation.xml',
    SLIDES: 'ppt/slides/',
    MASTERS: 'ppt/slideMasters/',
    THEMES: 'ppt/theme/',
    MEDIA: 'ppt/media/',
    RELATIONSHIPS: '_rels/',
    SLIDE_RELATIONSHIPS: 'ppt/slides/_rels/',
    MASTER_RELATIONSHIPS: 'ppt/slideMasters/_rels/'
  },

  // Расширения файлов
  EXTENSIONS: {
    SLIDE: '.xml',
    MASTER: '.xml',
    THEME: '.xml',
    RELATIONSHIP: '.xml.rels'
  }
}

// Экспорт типов для работы с XML данными
export interface XMLParseResult<T> {
  success: boolean
  data?: T
  errors: string[]
  warnings: string[]
  parseTime: number
}

// Экспорт интерфейса для парсера
export interface IParser<T> {
  parse(xmlContent: string): T
  validateStructure(data: any): boolean
  logStructure(data: any): void
}

// Экспорт фабрики парсеров
export class ParserFactory {
  private static parsers = new Map<string, any>()

  // Регистрация парсера
  static registerParser(name: string, parser: any): void {
    this.parsers.set(name, parser)
  }

  // Получение парсера по имени
  static getParser(name: string): any {
    return this.parsers.get(name)
  }

  // Создание парсера для presentation.xml
  static createPresentationParser(): any {
    return new (require('./PresentationParser').PresentationParser)()
  }

  // Создание парсера для slide*.xml
  static createSlideParser(): any {
    return new (require('./SlideParser').SlideParser)()
  }

  // Создание базового XML парсера
  static createXMLParser(options?: any): any {
    return new (require('./XMLParser').XMLParser)(options)
  }
}

// Автоматическая регистрация парсеров
ParserFactory.registerParser('presentation', ParserFactory.createPresentationParser)
ParserFactory.registerParser('slide', ParserFactory.createSlideParser)
ParserFactory.registerParser('xml', ParserFactory.createXMLParser)
