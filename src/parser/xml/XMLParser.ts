/**
 * @file: XMLParser.ts
 * @description: Базовый XML парсер для PPTX файлов
 * @dependencies: fast-xml-parser, models
 * @created: 2024-12-19
 */

import { XMLParser as FastXMLParser } from 'fast-xml-parser'
import { ModelFactories, ModelUtils } from '../../models'

export interface XMLParseOptions {
  ignoreAttributes: boolean
  attributeNamePrefix: string
  textNodeName: string
  ignoreNameSpace: boolean
  parseAttributeValue: boolean
  parseTagValue: boolean
  trimValues: boolean
}

export class XMLParser {
  private parser: FastXMLParser
  private defaultOptions: XMLParseOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    textNodeName: '#text',
    ignoreNameSpace: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true
  }

  constructor(options: Partial<XMLParseOptions> = {}) {
    this.parser = new FastXMLParser({
      ...this.defaultOptions,
      ...options
    })
  }

  // Парсинг XML строки
  parse(xmlString: string): any {
    try {
      return this.parser.parse(xmlString)
    } catch (error) {
      console.error('XML parsing error:', error)
      throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Парсинг XML файла из ArrayBuffer
  parseFromBuffer(buffer: ArrayBuffer): any {
    const xmlString = new TextDecoder('utf-8').decode(buffer)
    return this.parse(xmlString)
  }

  // Получение значения атрибута
  static getAttribute(obj: any, attributeName: string): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined
    
    const attrKey = `@${attributeName}`
    return obj[attrKey]
  }

  // Получение текстового содержимого
  static getTextContent(obj: any): string {
    if (!obj) return ''
    
    if (typeof obj === 'string') return obj
    
    if (obj['#text']) return obj['#text']
    
    return ''
  }

  // Получение дочернего элемента
  static getChild(obj: any, childName: string): any {
    if (!obj || typeof obj !== 'object') return undefined
    
    return obj[childName]
  }

  // Получение массива дочерних элементов
  static getChildren(obj: any, childName: string): any[] {
    const child = this.getChild(obj, childName)
    
    if (!child) return []
    
    if (Array.isArray(child)) return child
    
    return [child]
  }

  // Проверка существования элемента
  static hasElement(obj: any, elementName: string): boolean {
    return this.getChild(obj, elementName) !== undefined
  }

  // Получение числового значения атрибута
  static getNumberAttribute(obj: any, attributeName: string, defaultValue: number = 0): number {
    const value = this.getAttribute(obj, attributeName)
    if (value === undefined || value === '') return defaultValue
    
    const num = parseInt(value, 10)
    return isNaN(num) ? defaultValue : num
  }

  // Получение булевого значения атрибута
  static getBooleanAttribute(obj: any, attributeName: string, defaultValue: boolean = false): boolean {
    const value = this.getAttribute(obj, attributeName)
    if (value === undefined || value === '') return defaultValue
    
    return value === 'true' || value === '1' || value === 'on'
  }

  // Получение значения с преобразованием EMU в пиксели
  static getEMUAttribute(obj: any, attributeName: string, defaultValue: number = 0): number {
    const emuValue = this.getNumberAttribute(obj, attributeName, defaultValue)
    return ModelUtils.emuToPixels(emuValue)
  }

  // Получение значения с преобразованием EMU в точки
  static getEMUToPointsAttribute(obj: any, attributeName: string, defaultValue: number = 0): number {
    const emuValue = this.getNumberAttribute(obj, attributeName, defaultValue)
    return ModelUtils.emuToPoints(emuValue)
  }

  // Получение значения с преобразованием EMU в дюймы
  static getEMUToInchesAttribute(obj: any, attributeName: string, defaultValue: number = 0): number {
    const emuValue = this.getNumberAttribute(obj, attributeName, defaultValue)
    return ModelUtils.emuToInches(emuValue)
  }

  // Получение цвета из XML
  static getColor(obj: any): any {
    if (!obj) return undefined
    
    // Проверяем различные форматы цвета в PPTX
    if (obj.srgbClr) {
      const hexColor = this.getAttribute(obj.srgbClr, 'val')
      if (hexColor) {
        return ModelUtils.hexToRGB(hexColor)
      }
    }
    
    if (obj.schemeClr) {
      const schemeColor = this.getAttribute(obj.schemeClr, 'val')
      if (schemeColor) {
        return this.getSchemeColor(schemeColor)
      }
    }
    
    if (obj.sysClr) {
      const sysColor = this.getAttribute(obj.sysClr, 'val')
      if (sysColor) {
        return this.getSystemColor(sysColor)
      }
    }
    
    return undefined
  }

  // Получение цвета из схемы
  private static getSchemeColor(schemeName: string): any {
    const schemeColors: { [key: string]: any } = {
      'bg1': { r: 1, g: 1, b: 1 }, // Background 1
      'bg2': { r: 0.95, g: 0.95, b: 0.95 }, // Background 2
      'tx1': { r: 0, g: 0, b: 0 }, // Text 1
      'tx2': { r: 0.2, g: 0.2, b: 0.2 }, // Text 2
      'accent1': { r: 0.2, g: 0.4, b: 0.8 }, // Accent 1
      'accent2': { r: 0.8, g: 0.2, b: 0.2 }, // Accent 2
      'accent3': { r: 0.2, g: 0.8, b: 0.2 }, // Accent 3
      'accent4': { r: 0.8, g: 0.8, b: 0.2 }, // Accent 4
      'accent5': { r: 0.8, g: 0.2, b: 0.8 }, // Accent 5
      'accent6': { r: 0.2, g: 0.8, b: 0.8 }, // Accent 6
      'hlink': { r: 0, g: 0, b: 1 }, // Hyperlink
      'folHlink': { r: 0.5, g: 0, b: 0.5 } // Followed Hyperlink
    }
    
    return schemeColors[schemeName] || { r: 0, g: 0, b: 0 }
  }

  // Получение системного цвета
  private static getSystemColor(sysName: string): any {
    const systemColors: { [key: string]: any } = {
      'window': { r: 0.95, g: 0.95, b: 0.95 },
      'windowText': { r: 0, g: 0, b: 0 },
      'menu': { r: 0.95, g: 0.95, b: 0.95 },
      'menuText': { r: 0, g: 0, b: 0 },
      'buttonFace': { r: 0.9, g: 0.9, b: 0.9 },
      'buttonText': { r: 0, g: 0, b: 0 },
      'highlight': { r: 0.2, g: 0.4, b: 0.8 },
      'highlightText': { r: 1, g: 1, b: 1 }
    }
    
    return systemColors[sysName] || { r: 0, g: 0, b: 0 }
  }

  // Получение размера из XML
  static getSize(obj: any): { width: number; height: number } {
    if (!obj) {
      return ModelFactories.createSize(0, 0)
    }
    
    const width = this.getEMUAttribute(obj, 'cx', 0)
    const height = this.getEMUAttribute(obj, 'cy', 0)
    
    return ModelFactories.createSize(width, height)
  }

  // Получение позиции из XML
  static getPosition(obj: any): { x: number; y: number } {
    if (!obj) {
      return ModelFactories.createPoint(0, 0)
    }
    
    const x = this.getEMUAttribute(obj, 'x', 0)
    const y = this.getEMUAttribute(obj, 'y', 0)
    
    return ModelFactories.createPoint(x, y)
  }

  // Получение прямоугольника из XML
  static getRectangle(obj: any): { x: number; y: number; width: number; height: number } {
    if (!obj) {
      return ModelFactories.createRectangle(0, 0, 0, 0)
    }
    
    const x = this.getEMUAttribute(obj, 'x', 0)
    const y = this.getEMUAttribute(obj, 'y', 0)
    const width = this.getEMUAttribute(obj, 'cx', 0)
    const height = this.getEMUAttribute(obj, 'cy', 0)
    
    return ModelFactories.createRectangle(x, y, width, height)
  }

  // Получение поворота из XML
  static getRotation(obj: any): number {
    if (!obj) return 0
    
    const rotation = this.getNumberAttribute(obj, 'rot', 0)
    // PPTX использует 60000 единиц на градус
    return rotation / 60000
  }

  // Получение прозрачности из XML
  static getOpacity(obj: any): number {
    if (!obj) return 1
    
    const alpha = this.getNumberAttribute(obj, 'alpha', 100000)
    // PPTX использует 100000 единиц для 100%
    return alpha / 100000
  }

  // Получение толщины линии из XML
  static getLineWidth(obj: any): number {
    if (!obj) return 0
    
    const width = this.getEMUAttribute(obj, 'w', 0)
    return width
  }

  // Получение типа линии из XML
  static getLineType(obj: any): 'none' | 'solid' | 'dashed' | 'dotted' {
    if (!obj) return 'none'
    
    const lineType = this.getAttribute(obj, 'val')
    
    switch (lineType) {
      case 'sng':
        return 'solid'
      case 'dash':
        return 'dashed'
      case 'dot':
        return 'dotted'
      default:
        return 'none'
    }
  }

  // Получение выравнивания текста из XML
  static getTextAlignment(obj: any): 'left' | 'center' | 'right' | 'justify' {
    if (!obj) return 'left'
    
    const alignment = this.getAttribute(obj, 'val')
    
    switch (alignment) {
      case 'ctr':
        return 'center'
      case 'r':
        return 'right'
      case 'just':
        return 'justify'
      default:
        return 'left'
    }
  }

  // Получение размера шрифта из XML
  static getFontSize(obj: any): number {
    if (!obj) return 12
    
    const size = this.getNumberAttribute(obj, 'sz', 1200)
    // PPTX использует 100 единиц на пункт
    return size / 100
  }

  // Получение имени шрифта из XML
  static getFontFamily(obj: any): string {
    if (!obj) return 'Arial'
    
    return this.getAttribute(obj, 'typeface') || 'Arial'
  }

  // Получение веса шрифта из XML
  static getFontWeight(obj: any): 'normal' | 'bold' {
    if (!obj) return 'normal'
    
    const bold = this.getBooleanAttribute(obj, 'b', false)
    return bold ? 'bold' : 'normal'
  }

  // Получение стиля шрифта из XML
  static getFontStyle(obj: any): 'normal' | 'italic' {
    if (!obj) return 'normal'
    
    const italic = this.getBooleanAttribute(obj, 'i', false)
    return italic ? 'italic' : 'normal'
  }

  // Получение подчеркивания из XML
  static getTextDecoration(obj: any): 'none' | 'underline' | 'line-through' {
    if (!obj) return 'none'
    
    const underline = this.getAttribute(obj, 'u')
    
    switch (underline) {
      case 'sng':
        return 'underline'
      case 'dbl':
        return 'underline'
      case 'strike':
        return 'line-through'
      default:
        return 'none'
    }
  }

  // Логирование для отладки
  static logElement(elementName: string, data: any, level: number = 0): void {
    const indent = '  '.repeat(level)
    console.log(`${indent}${elementName}:`, data)
  }

  // Валидация XML структуры
  static validateStructure(obj: any, requiredFields: string[]): boolean {
    if (!obj || typeof obj !== 'object') return false
    
    for (const field of requiredFields) {
      if (!this.hasElement(obj, field)) {
        console.warn(`Missing required field: ${field}`)
        return false
      }
    }
    
    return true
  }
}
