/**
 * @file: ThemeParser.ts
 * @description: Парсер для theme*.xml файлов PPTX
 * @dependencies: XMLParser, types.ts
 * @created: 2024-12-19
 */

import { XMLParser } from './XMLParser'
import { Theme, ColorScheme, FontScheme, ColorInfo, FontInfo } from '../../models/types'

export interface ThemeParseResult {
  theme: Theme
  colorScheme: ColorScheme
  fontScheme: FontScheme
  errors: string[]
  warnings: string[]
  parseTime: number
}

export class ThemeParser extends XMLParser {
  private colorScheme: ColorScheme | null = null
  private fontScheme: FontScheme | null = null

  constructor() {
    super()
  }

  // Основной метод парсинга темы
  parseTheme(xmlContent: string, themeNumber: number): ThemeParseResult {
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const xmlData = this.parse(xmlContent)
      
      if (!xmlData || !xmlData['a:theme']) {
        throw new Error('Invalid theme XML structure')
      }

      const theme = xmlData['a:theme']
      const themeElements = theme['a:themeElements'] || {}

      // Парсинг цветовой схемы
      this.colorScheme = this.parseColorScheme(themeElements['a:clrScheme'] || {})
      
      // Парсинг схемы шрифтов
      this.fontScheme = this.parseFontScheme(themeElements['a:fontScheme'] || {})

      // Создание объекта темы
      const themeObject: Theme = {
        id: `theme-${themeNumber}`,
        name: this.extractThemeName(theme, themeNumber),
        number: themeNumber,
        colors: this.colorScheme,
        fonts: this.fontScheme,
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          version: '1.0'
        }
      }

      const parseTime = Date.now() - startTime

      return {
        theme: themeObject,
        colorScheme: this.colorScheme!,
        fontScheme: this.fontScheme!,
        errors,
        warnings,
        parseTime
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Theme parsing error: ${errorMessage}`)
      
      return {
        theme: this.createDefaultTheme(themeNumber),
        colorScheme: this.createDefaultColorScheme(),
        fontScheme: this.createDefaultFontScheme(),
        errors,
        warnings,
        parseTime: Date.now() - startTime
      }
    }
  }

  // Парсинг цветовой схемы
  private parseColorScheme(clrScheme: any): ColorScheme {
    const colors: { [key: string]: ColorInfo } = {}

    // Стандартные цвета схемы
    const standardColors = [
      'dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 
      'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'
    ]

    standardColors.forEach(colorKey => {
      const colorElement = clrScheme[`a:${colorKey}`]
      if (colorElement) {
        colors[colorKey] = this.parseColorInfo(colorElement)
      }
    })

    return {
      id: `color-scheme-${Date.now()}`,
      name: 'Default Color Scheme',
      colors,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0'
      }
    }
  }

  // Парсинг информации о цвете
  private parseColorInfo(colorElement: any): ColorInfo {
    // Проверяем различные типы цветов
    if (colorElement['a:srgbClr']) {
      const srgb = colorElement['a:srgbClr']
      return {
        type: 'rgb',
        value: srgb['@attributes']?.val || '000000',
        tint: this.parseTint(srgb['a:tint']),
        shade: this.parseShade(srgb['a:shade']),
        alpha: this.parseAlpha(srgb['a:alpha'])
      }
    }

    if (colorElement['a:schemeClr']) {
      const scheme = colorElement['a:schemeClr']
      return {
        type: 'scheme',
        value: scheme['@attributes']?.val || 'dk1',
        tint: this.parseTint(scheme['a:tint']),
        shade: this.parseShade(scheme['a:shade']),
        alpha: this.parseAlpha(scheme['a:alpha'])
      }
    }

    if (colorElement['a:sysClr']) {
      const sys = colorElement['a:sysClr']
      return {
        type: 'system',
        value: sys['@attributes']?.val || 'window',
        tint: this.parseTint(sys['a:tint']),
        shade: this.parseShade(sys['a:shade']),
        alpha: this.parseAlpha(sys['a:alpha'])
      }
    }

    // Цвет по умолчанию
    return {
      type: 'rgb',
      value: '000000',
      tint: 0,
      shade: 0,
      alpha: 1
    }
  }

  // Парсинг схемы шрифтов
  private parseFontScheme(fontScheme: any): FontScheme {
    const fonts: { [key: string]: FontInfo } = {}

    // Основные шрифты
    const fontTypes = ['majorFont', 'minorFont']
    
    fontTypes.forEach(fontType => {
      const fontElement = fontScheme[`a:${fontType}`]
      if (fontElement) {
        const latinFont = fontElement['a:latin']
        const eaFont = fontElement['a:ea']
        const csFont = fontElement['a:cs']

        fonts[fontType] = {
          latin: latinFont ? this.parseFontInfo(latinFont) : this.createDefaultFontInfo(),
          eastAsian: eaFont ? this.parseFontInfo(eaFont) : this.createDefaultFontInfo(),
          complexScript: csFont ? this.parseFontInfo(csFont) : this.createDefaultFontInfo()
        }
      }
    })

    return {
      id: `font-scheme-${Date.now()}`,
      name: 'Default Font Scheme',
      fonts,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0'
      }
    }
  }

  // Парсинг информации о шрифте
  private parseFontInfo(fontElement: any): FontInfo {
    return {
      typeface: fontElement['@attributes']?.typeface || 'Arial',
      panose: fontElement['@attributes']?.panose || '',
      pitchFamily: fontElement['@attributes']?.pitchFamily || '18',
      charset: fontElement['@attributes']?.charset || '0'
    }
  }

  // Парсинг tint (осветление)
  private parseTint(tintElement: any): number {
    if (!tintElement) return 0
    const value = parseInt(tintElement['@attributes']?.val || '0')
    return Math.max(0, Math.min(100, value)) / 100
  }

  // Парсинг shade (затемнение)
  private parseShade(shadeElement: any): number {
    if (!shadeElement) return 0
    const value = parseInt(shadeElement['@attributes']?.val || '0')
    return Math.max(0, Math.min(100, value)) / 100
  }

  // Парсинг alpha (прозрачность)
  private parseAlpha(alphaElement: any): number {
    if (!alphaElement) return 1
    const value = parseInt(alphaElement['@attributes']?.val || '100000')
    return Math.max(0, Math.min(1, value / 100000))
  }

  // Извлечение имени темы
  private extractThemeName(theme: any, themeNumber: number): string {
    const themeName = theme['@attributes']?.name
    return themeName || `Theme ${themeNumber}`
  }

  // Создание темы по умолчанию
  private createDefaultTheme(themeNumber: number): Theme {
    return {
      id: `theme-${themeNumber}`,
      name: `Theme ${themeNumber}`,
      number: themeNumber,
      colors: this.createDefaultColorScheme(),
      fonts: this.createDefaultFontScheme(),
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0'
      }
    }
  }

  // Создание цветовой схемы по умолчанию
  private createDefaultColorScheme(): ColorScheme {
    return {
      id: `default-color-scheme`,
      name: 'Default Color Scheme',
      colors: {
        dk1: { type: 'rgb', value: '000000', tint: 0, shade: 0, alpha: 1 },
        lt1: { type: 'rgb', value: 'FFFFFF', tint: 0, shade: 0, alpha: 1 },
        dk2: { type: 'rgb', value: '44546A', tint: 0, shade: 0, alpha: 1 },
        lt2: { type: 'rgb', value: 'E7E6E6', tint: 0, shade: 0, alpha: 1 },
        accent1: { type: 'rgb', value: '5B9BD5', tint: 0, shade: 0, alpha: 1 },
        accent2: { type: 'rgb', value: 'ED7D31', tint: 0, shade: 0, alpha: 1 },
        accent3: { type: 'rgb', value: 'A5A5A5', tint: 0, shade: 0, alpha: 1 },
        accent4: { type: 'rgb', value: 'FFC000', tint: 0, shade: 0, alpha: 1 },
        accent5: { type: 'rgb', value: '4472C4', tint: 0, shade: 0, alpha: 1 },
        accent6: { type: 'rgb', value: '70AD47', tint: 0, shade: 0, alpha: 1 },
        hlink: { type: 'rgb', value: '0563C1', tint: 0, shade: 0, alpha: 1 },
        folHlink: { type: 'rgb', value: '954F72', tint: 0, shade: 0, alpha: 1 }
      },
      metadata: {
        created: new Date().toISOString(),
        version: '1.0'
      }
    }
  }

  // Создание схемы шрифтов по умолчанию
  private createDefaultFontScheme(): FontScheme {
    const defaultFont = this.createDefaultFontInfo()
    
    return {
      id: `default-font-scheme`,
      name: 'Default Font Scheme',
      fonts: {
        majorFont: {
          latin: defaultFont,
          eastAsian: defaultFont,
          complexScript: defaultFont
        },
        minorFont: {
          latin: defaultFont,
          eastAsian: defaultFont,
          complexScript: defaultFont
        }
      },
      metadata: {
        created: new Date().toISOString(),
        version: '1.0'
      }
    }
  }

  // Создание информации о шрифте по умолчанию
  private createDefaultFontInfo(): FontInfo {
    return {
      typeface: 'Arial',
      panose: '020B0604020202020204',
      pitchFamily: '18',
      charset: '0'
    }
  }

  // Валидация структуры темы
  validateThemeStructure(data: any): boolean {
    return !!(data && data['a:theme'] && data['a:theme']['a:themeElements'])
  }

  // Логирование структуры темы
  logThemeStructure(data: any): void {
    console.log('Theme structure:', {
      hasTheme: !!data?.['a:theme'],
      hasThemeElements: !!data?.['a:theme']?.['a:themeElements'],
      hasColorScheme: !!data?.['a:theme']?.['a:themeElements']?.['a:clrScheme'],
      hasFontScheme: !!data?.['a:theme']?.['a:themeElements']?.['a:fontScheme']
    })
  }
}
