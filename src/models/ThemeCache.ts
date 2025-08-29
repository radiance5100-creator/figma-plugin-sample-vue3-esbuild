/**
 * @file: ThemeCache.ts
 * @description: Система кэширования тем и цветовых схем
 * @dependencies: types.ts
 * @created: 2024-12-19
 */

import { Theme, ColorScheme, FontScheme, ColorInfo } from './types'

export interface ThemeCacheEntry {
  theme: Theme
  colorScheme: ColorScheme
  fontScheme: FontScheme
  lastAccessed: number
  accessCount: number
}

export class ThemeCache {
  private cache: Map<string, ThemeCacheEntry> = new Map()
  private maxSize: number = 10 // Максимальное количество тем в кэше
  private defaultTheme: Theme | null = null

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize
  }

  // Добавление темы в кэш
  set(themeId: string, theme: Theme, colorScheme: ColorScheme, fontScheme: FontScheme): void {
    // Если кэш переполнен, удаляем наименее используемую тему
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    const entry: ThemeCacheEntry = {
      theme,
      colorScheme,
      fontScheme,
      lastAccessed: Date.now(),
      accessCount: 0
    }

    this.cache.set(themeId, entry)
  }

  // Получение темы из кэша
  get(themeId: string): ThemeCacheEntry | null {
    const entry = this.cache.get(themeId)
    
    if (entry) {
      // Обновляем статистику использования
      entry.lastAccessed = Date.now()
      entry.accessCount++
      return entry
    }

    return null
  }

  // Проверка наличия темы в кэше
  has(themeId: string): boolean {
    return this.cache.has(themeId)
  }

  // Удаление темы из кэша
  delete(themeId: string): boolean {
    return this.cache.delete(themeId)
  }

  // Очистка всего кэша
  clear(): void {
    this.cache.clear()
  }

  // Получение размера кэша
  size(): number {
    return this.cache.size
  }

  // Установка темы по умолчанию
  setDefaultTheme(theme: Theme): void {
    this.defaultTheme = theme
  }

  // Получение темы по умолчанию
  getDefaultTheme(): Theme | null {
    return this.defaultTheme
  }

  // Получение цвета из цветовой схемы с учетом tint/shade
  getColor(colorScheme: ColorScheme, colorKey: string, tint?: number, shade?: number, alpha?: number): string {
    const colorInfo = colorScheme.colors[colorKey]
    
    if (!colorInfo) {
      return '#000000' // Цвет по умолчанию
    }

    let color = this.parseColorValue(colorInfo)
    
    // Применяем tint (осветление)
    if (tint !== undefined && tint > 0) {
      color = this.applyTint(color, tint)
    } else if (colorInfo.tint > 0) {
      color = this.applyTint(color, colorInfo.tint)
    }

    // Применяем shade (затемнение)
    if (shade !== undefined && shade > 0) {
      color = this.applyShade(color, shade)
    } else if (colorInfo.shade > 0) {
      color = this.applyShade(color, colorInfo.shade)
    }

    // Применяем alpha (прозрачность)
    const finalAlpha = alpha !== undefined ? alpha : colorInfo.alpha
    if (finalAlpha < 1) {
      color = this.applyAlpha(color, finalAlpha)
    }

    return color
  }

  // Парсинг значения цвета
  private parseColorValue(colorInfo: ColorInfo): string {
    switch (colorInfo.type) {
      case 'rgb':
        return `#${colorInfo.value}`
      case 'scheme':
        // Для scheme цветов возвращаем базовый цвет
        return this.getSchemeColor(colorInfo.value)
      case 'system':
        // Для системных цветов возвращаем базовый цвет
        return this.getSystemColor(colorInfo.value)
      default:
        return '#000000'
    }
  }

  // Получение цвета схемы
  private getSchemeColor(schemeKey: string): string {
    // Стандартные цвета схемы
    const schemeColors: { [key: string]: string } = {
      'dk1': '#000000', // Темный 1
      'lt1': '#FFFFFF', // Светлый 1
      'dk2': '#44546A', // Темный 2
      'lt2': '#E7E6E6', // Светлый 2
      'accent1': '#5B9BD5', // Акцент 1
      'accent2': '#ED7D31', // Акцент 2
      'accent3': '#A5A5A5', // Акцент 3
      'accent4': '#FFC000', // Акцент 4
      'accent5': '#4472C4', // Акцент 5
      'accent6': '#70AD47', // Акцент 6
      'hlink': '#0563C1', // Гиперссылка
      'folHlink': '#954F72' // Посещенная гиперссылка
    }

    return schemeColors[schemeKey] || '#000000'
  }

  // Получение системного цвета
  private getSystemColor(systemKey: string): string {
    // Системные цвета
    const systemColors: { [key: string]: string } = {
      'window': '#FFFFFF', // Цвет окна
      'windowText': '#000000', // Цвет текста окна
      'menu': '#F0F0F0', // Цвет меню
      'menuText': '#000000', // Цвет текста меню
      'buttonFace': '#E1E1E1', // Цвет кнопки
      'buttonText': '#000000', // Цвет текста кнопки
      'highlight': '#0078D4', // Цвет выделения
      'highlightText': '#FFFFFF' // Цвет текста выделения
    }

    return systemColors[systemKey] || '#000000'
  }

  // Применение tint (осветление)
  private applyTint(color: string, tint: number): string {
    const rgb = this.hexToRgb(color)
    if (!rgb) return color

    const tinted = {
      r: Math.round(rgb.r + (255 - rgb.r) * tint),
      g: Math.round(rgb.g + (255 - rgb.g) * tint),
      b: Math.round(rgb.b + (255 - rgb.b) * tint)
    }

    return this.rgbToHex(tinted.r, tinted.g, tinted.b)
  }

  // Применение shade (затемнение)
  private applyShade(color: string, shade: number): string {
    const rgb = this.hexToRgb(color)
    if (!rgb) return color

    const shaded = {
      r: Math.round(rgb.r * (1 - shade)),
      g: Math.round(rgb.g * (1 - shade)),
      b: Math.round(rgb.b * (1 - shade))
    }

    return this.rgbToHex(shaded.r, shaded.g, shaded.b)
  }

  // Применение alpha (прозрачность)
  private applyAlpha(color: string, alpha: number): string {
    const rgb = this.hexToRgb(color)
    if (!rgb) return color

    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
    return `${color}${alphaHex}`
  }

  // Конвертация hex в RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Конвертация RGB в hex
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, c)).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  // Удаление наименее используемой темы
  private evictLeastUsed(): void {
    let leastUsed: string | null = null
    let minScore = Infinity

    for (const [themeId, entry] of this.cache.entries()) {
      // Простая формула для оценки важности: количество обращений * время последнего обращения
      const score = entry.accessCount * (Date.now() - entry.lastAccessed)
      
      if (score < minScore) {
        minScore = score
        leastUsed = themeId
      }
    }

    if (leastUsed) {
      this.cache.delete(leastUsed)
    }
  }

  // Получение статистики кэша
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    mostUsed: string[]
  } {
    const entries = Array.from(this.cache.entries())
    const sortedByUsage = entries.sort((a, b) => b[1].accessCount - a[1].accessCount)
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Реализовать подсчет hit rate
      mostUsed: sortedByUsage.slice(0, 5).map(([id]) => id)
    }
  }
}
