/**
 * @file: utils.ts
 * @description: Утилиты для парсера PPTX
 * @dependencies: types.ts
 * @created: 2024-12-19
 */

import { EMU, Point, Pixel, Color, EMU_TO_PIXELS, POINT_TO_PIXELS } from './types'

// Конвертация единиц измерения
export function emuToPixels(emu: number): number {
  return emu * EMU_TO_PIXELS
}

export function pointToPixels(point: number): number {
  return point * POINT_TO_PIXELS
}

export function pixelsToEmu(pixels: number): number {
  return pixels / EMU_TO_PIXELS
}

export function pixelsToPoint(pixels: number): number {
  return pixels / POINT_TO_PIXELS
}

// Работа с цветами
export function hexToRgb(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  }
}

export function rgbToHex(color: Color): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function parseThemeColor(colorNode: any): Color | null {
  if (!colorNode) return null
  
  // Обработка различных типов цветов в PPTX
  if (colorNode.srgbClr) {
    return hexToRgb(`#${colorNode.srgbClr}`)
  }
  
  if (colorNode.schemeClr) {
    // Возвращаем базовый цвет для схемы (будет заменен темой)
    return { r: 0.5, g: 0.5, b: 0.5 }
  }
  
  if (colorNode.sysClr) {
    // Системные цвета
    const sysColor = colorNode.sysClr.val
    switch (sysColor) {
      case 'windowText':
        return { r: 0, g: 0, b: 0 }
      case 'window':
        return { r: 1, g: 1, b: 1 }
      default:
        return { r: 0.5, g: 0.5, b: 0.5 }
    }
  }
  
  return null
}

// Работа с XML
export function parseXML(xmlString: string): any {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')
    
    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error('XML parsing error')
    }
    
    return xmlToJson(doc.documentElement)
  } catch (error) {
    throw new Error(`Failed to parse XML: ${error.message}`)
  }
}

function xmlToJson(xml: Element): any {
  const obj: any = {}
  
  if (xml.nodeType === 1) { // Element node
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {}
      for (let i = 0; i < xml.attributes.length; i++) {
        const attr = xml.attributes.item(i)
        if (attr) {
          obj['@attributes'][attr.nodeName] = attr.nodeValue
        }
      }
    }
  } else if (xml.nodeType === 3) { // Text node
    const text = xml.nodeValue?.trim()
    if (text) {
      return text
    }
  }
  
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const child = xml.childNodes.item(i)
      if (child.nodeType === 1) { // Element node
        const childName = child.nodeName
        const childValue = xmlToJson(child as Element)
        
        if (obj[childName] === undefined) {
          obj[childName] = childValue
        } else {
          if (!Array.isArray(obj[childName])) {
            obj[childName] = [obj[childName]]
          }
          obj[childName].push(childValue)
        }
      } else if (child.nodeType === 3) { // Text node
        const text = child.nodeValue?.trim()
        if (text) {
          obj['#text'] = text
        }
      }
    }
  }
  
  return obj
}

// Работа с файлами
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

export function isValidPPTXFile(fileName: string): boolean {
  return getFileExtension(fileName) === 'pptx'
}

// Генерация ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Валидация данных
export function validateSlideData(slide: any): boolean {
  return slide && 
         typeof slide.id === 'string' && 
         typeof slide.name === 'string' &&
         Array.isArray(slide.elements)
}

export function validateElementData(element: any): boolean {
  return element && 
         typeof element.id === 'string' && 
         typeof element.type === 'string' &&
         typeof element.x === 'number' &&
         typeof element.y === 'number' &&
         typeof element.width === 'number' &&
         typeof element.height === 'number'
}

// Обработка ошибок
export function createParseError(message: string, context?: string): Error {
  const error = new Error(message)
  ;(error as any).context = context
  return error
}

// Логирование
export function logParseStep(step: string, data?: any): void {
  console.log(`[PPTX Parser] ${step}`, data || '')
}

export function logParseError(error: Error, context?: string): void {
  console.error(`[PPTX Parser] Error in ${context || 'unknown context'}:`, error.message)
}

// Утилиты для работы с массивами
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Утилиты для работы с геометрией
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

export function scaleToFit(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = calculateAspectRatio(originalWidth, originalHeight)
  
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight }
  }
  
  if (maxWidth / aspectRatio <= maxHeight) {
    return { width: maxWidth, height: maxWidth / aspectRatio }
  } else {
    return { width: maxHeight * aspectRatio, height: maxHeight }
  }
}
