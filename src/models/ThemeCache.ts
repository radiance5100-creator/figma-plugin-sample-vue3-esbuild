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
  size: number
}

export interface ThemeCacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  averageAccessTime: number
}

export class ThemeCache {
  private cache = new Map<string, ThemeCacheEntry>()
  private maxSize: number
  private maxEntries: number
  private stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0
  }

  constructor(maxSize: number = 10 * 1024 * 1024, maxEntries: number = 100) {
    this.maxSize = maxSize
    this.maxEntries = maxEntries
  }

  // Добавление темы в кэш
  set(themeId: string, theme: Theme, colorScheme: ColorScheme, fontScheme: FontScheme): void {
    const entry: ThemeCacheEntry = {
      theme,
      colorScheme,
      fontScheme,
      lastAccessed: Date.now(),
      accessCount: 0,
      size: this.calculateEntrySize(theme, colorScheme, fontScheme)
    }

    // Проверка лимитов кэша
    this.ensureCacheLimits(entry.size)

    this.cache.set(themeId, entry)
  }

  // Получение темы из кэша
  get(themeId: string): { theme: Theme; colorScheme: ColorScheme; fontScheme: FontScheme } | null {
    const startTime = Date.now()
    const entry = this.cache.get(themeId)

    if (entry) {
      // Обновление статистики доступа
      entry.lastAccessed = Date.now()
      entry.accessCount++
      this.stats.hits++
      this.stats.totalAccessTime += Date.now() - startTime
      this.stats.accessCount++

      return {
        theme: entry.theme,
        colorScheme: entry.colorScheme,
        fontScheme: entry.fontScheme
      }
    }

    this.stats.misses++
    this.stats.totalAccessTime += Date.now() - startTime
    this.stats.accessCount++

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
    this.resetStats()
  }

  // Получение статистики кэша
  getStats(): ThemeCacheStats {
    const totalEntries = this.cache.size
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)
    const hitRate = this.stats.accessCount > 0 ? this.stats.hits / this.stats.accessCount : 0
    const missRate = this.stats.accessCount > 0 ? this.stats.misses / this.stats.accessCount : 0
    const averageAccessTime = this.stats.accessCount > 0 ? this.stats.totalAccessTime / this.stats.accessCount : 0

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      averageAccessTime
    }
  }

  // Получение списка всех тем в кэше
  getAllThemes(): Theme[] {
    return Array.from(this.cache.values()).map(entry => entry.theme)
  }

  // Поиск тем по имени
  findThemesByName(name: string): Theme[] {
    return Array.from(this.cache.values())
      .filter(entry => entry.theme.name.toLowerCase().includes(name.toLowerCase()))
      .map(entry => entry.theme)
  }

  // Получение цветовой схемы по ID темы
  getColorScheme(themeId: string): ColorScheme | null {
    const entry = this.cache.get(themeId)
    return entry ? entry.colorScheme : null
  }

  // Получение схемы шрифтов по ID темы
  getFontScheme(themeId: string): FontScheme | null {
    const entry = this.cache.get(themeId)
    return entry ? entry.fontScheme : null
  }

  // Получение цвета из схемы по ключу
  getColorFromScheme(themeId: string, colorKey: string): ColorInfo | null {
    const colorScheme = this.getColorScheme(themeId)
    return colorScheme ? colorScheme.colors[colorKey] || null : null
  }

  // Применение tint/shade к цвету
  applyTintShade(color: ColorInfo, tint: number = 0, shade: number = 0): ColorInfo {
    if (color.type !== 'rgb') return color

    let rgbValue = color.value
    let r = parseInt(rgbValue.substr(0, 2), 16) / 255
    let g = parseInt(rgbValue.substr(2, 2), 16) / 255
    let b = parseInt(rgbValue.substr(4, 2), 16) / 255

    // Применение tint (осветление)
    if (tint > 0) {
      r = r + (1 - r) * tint
      g = g + (1 - g) * tint
      b = b + (1 - b) * tint
    }

    // Применение shade (затемнение)
    if (shade > 0) {
      r = r * (1 - shade)
      g = g * (1 - shade)
      b = b * (1 - shade)
    }

    // Ограничение значений
    r = Math.max(0, Math.min(1, r))
    g = Math.max(0, Math.min(1, g))
    b = Math.max(0, Math.min(1, b))

    const newRgbValue = 
      Math.round(r * 255).toString(16).padStart(2, '0') +
      Math.round(g * 255).toString(16).padStart(2, '0') +
      Math.round(b * 255).toString(16).padStart(2, '0')

    return {
      ...color,
      value: newRgbValue,
      tint: color.tint + tint,
      shade: color.shade + shade
    }
  }

  // Конвертация цвета в формат Figma
  convertToFigmaColor(color: ColorInfo): { r: number; g: number; b: number; a?: number } {
    if (color.type === 'rgb') {
      const r = parseInt(color.value.substr(0, 2), 16) / 255
      const g = parseInt(color.value.substr(2, 2), 16) / 255
      const b = parseInt(color.value.substr(4, 2), 16) / 255

      return {
        r,
        g,
        b,
        a: color.alpha
      }
    }

    // Для scheme и system цветов возвращаем дефолтный черный
    return { r: 0, g: 0, b: 0, a: color.alpha }
  }

  // Обеспечение лимитов кэша
  private ensureCacheLimits(newEntrySize: number): void {
    const currentSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)
    const currentEntries = this.cache.size

    // Если превышен лимит размера или количества записей
    if (currentSize + newEntrySize > this.maxSize || currentEntries >= this.maxEntries) {
      this.evictLeastUsed()
    }
  }

  // Удаление наименее используемых записей
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
    
    // Сортировка по времени последнего доступа и количеству обращений
    entries.sort((a, b) => {
      const scoreA = a[1].lastAccessed + (a[1].accessCount * 1000)
      const scoreB = b[1].lastAccessed + (b[1].accessCount * 1000)
      return scoreA - scoreB
    })

    // Удаление 20% наименее используемых записей
    const toRemove = Math.ceil(entries.length * 0.2)
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  // Расчет размера записи в кэше
  private calculateEntrySize(theme: Theme, colorScheme: ColorScheme, fontScheme: FontScheme): number {
    // Простая оценка размера в байтах
    let size = 0

    // Размер темы
    size += JSON.stringify(theme).length

    // Размер цветовой схемы
    size += JSON.stringify(colorScheme).length

    // Размер схемы шрифтов
    size += JSON.stringify(fontScheme).length

    return size
  }

  // Сброс статистики
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      accessCount: 0
    }
  }

  // Получение информации о кэше для отладки
  getDebugInfo(): any {
    return {
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      maxEntries: this.maxEntries,
      stats: this.getStats(),
      entries: Array.from(this.cache.entries()).map(([id, entry]) => ({
        id,
        name: entry.theme.name,
        lastAccessed: new Date(entry.lastAccessed).toISOString(),
        accessCount: entry.accessCount,
        size: entry.size
      }))
    }
  }
}

// Глобальный экземпляр кэша тем
export const globalThemeCache = new ThemeCache()
