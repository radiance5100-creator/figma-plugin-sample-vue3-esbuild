/**
 * @file: TextParser.ts
 * @description: Парсер для текстовых элементов PPTX (txBody, p, r)
 * @dependencies: XMLParser, types.ts
 * @created: 2024-12-19
 */

import { XMLParser } from './XMLParser'
import { TextElement, TextRun, Paragraph, TextStyle, ListStyle, Hyperlink } from '../../models/types'

export interface TextParseResult {
  success: boolean
  paragraphs: Paragraph[]
  errors: string[]
  warnings: string[]
}

export class TextParser extends XMLParser {
  
  constructor() {
    super({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text',
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: true
    })
  }

  // Парсинг текстового блока (txBody)
  parseTextBody(xmlContent: string): TextParseResult {
    const result: TextParseResult = {
      success: false,
      paragraphs: [],
      errors: [],
      warnings: []
    }

    try {
      const xmlData = this.parse(xmlContent)
      const txBody = xmlData['a:txBody'] || xmlData.txBody
      
      if (!txBody) {
        result.errors.push('Текстовый блок (txBody) не найден')
        return result
      }

      // Парсинг абзацев
      const paragraphs = this.parseParagraphs(txBody)
      result.paragraphs = paragraphs
      result.success = true

    } catch (error) {
      result.errors.push(`Ошибка парсинга текстового блока: ${error.message}`)
    }

    return result
  }

  // Парсинг абзацев (p)
  private parseParagraphs(txBody: any): Paragraph[] {
    const paragraphs = txBody['a:p'] || txBody.p || []
    const elements: Paragraph[] = []

    if (!Array.isArray(paragraphs)) {
      // Если только один абзац
      const paragraph = this.parseParagraph(paragraphs, 0)
      return paragraph ? [paragraph] : []
    }

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      const element = this.parseParagraph(paragraph, i)
      if (element) {
        elements.push(element)
      }
    }

    return elements
  }

  // Парсинг отдельного абзаца
  private parseParagraph(pElement: any, index: number): Paragraph | null {
    if (!pElement) return null

    try {
      // Парсинг текстовых runs (r)
      const runs = this.parseTextRuns(pElement)
      
      // Парсинг свойств абзаца
      const paragraphProps = this.parseParagraphProperties(pElement)
      
      // Создание элемента абзаца
      const paragraph: Paragraph = {
        id: `paragraph-${index}`,
        runs,
        style: paragraphProps,
        level: paragraphProps.level || 0
      }

      return paragraph

    } catch (error) {
      console.warn(`Ошибка парсинга абзаца ${index}:`, error)
      return null
    }
  }

  // Парсинг текстовых runs (r)
  private parseTextRuns(pElement: any): TextRun[] {
    const runs = pElement['a:r'] || pElement.r || []
    const textRuns: TextRun[] = []

    if (!Array.isArray(runs)) {
      // Если только один run
      const run = this.parseTextRun(runs, 0)
      if (run) textRuns.push(run)
      return textRuns
    }

    for (let i = 0; i < runs.length; i++) {
      const run = runs[i]
      const textRun = this.parseTextRun(run, i)
      if (textRun) {
        textRuns.push(textRun)
      }
    }

    return textRuns
  }

  // Парсинг отдельного текстового run
  private parseTextRun(rElement: any, index: number): TextRun | null {
    if (!rElement) return null

    try {
      // Извлечение текста
      const textElement = rElement['a:t'] || rElement.t
      const text = this.extractText(textElement)

      // Парсинг свойств run
      const runProps = this.parseRunProperties(rElement)
      
      // Парсинг гиперссылки
      const hyperlink = this.parseHyperlink(rElement)
      
      // Создание текстового run
      const textRun: TextRun = {
        id: `run-${index}`,
        text,
        style: runProps,
        startIndex: 0, // TODO: Вычислить правильный индекс
        endIndex: text.length,
        hyperlink
      }

      return textRun

    } catch (error) {
      console.warn(`Ошибка парсинга текстового run ${index}:`, error)
      return null
    }
  }

  // Извлечение текста из элемента
  private extractText(textElement: any): string {
    if (!textElement) return ''

    if (typeof textElement === 'string') {
      return textElement
    }

    if (textElement['#text']) {
      return textElement['#text']
    }

    if (Array.isArray(textElement)) {
      return textElement.map(item => this.extractText(item)).join('')
    }

    return ''
  }

  // Парсинг свойств абзаца
  private parseParagraphProperties(pElement: any): TextStyle {
    const pPr = pElement['a:pPr'] || pElement.pPr || {}
    
    return {
      alignment: this.parseAlignment(pPr),
      level: this.parseLevel(pPr),
      spacing: this.parseSpacing(pPr),
      listStyle: this.parseListStyle(pPr),
      indentation: this.parseIndentation(pPr)
    }
  }

  // Парсинг свойств run
  private parseRunProperties(rElement: any): TextStyle {
    const rPr = rElement['a:rPr'] || rElement.rPr || {}
    
    return {
      font: this.parseFont(rPr),
      size: this.parseFontSize(rPr),
      color: this.parseColor(rPr),
      bold: this.parseBold(rPr),
      italic: this.parseItalic(rPr),
      underline: this.parseUnderline(rPr),
      strikethrough: this.parseStrikethrough(rPr)
    }
  }

  // Парсинг выравнивания
  private parseAlignment(pPr: any): string {
    const algn = pPr['@algn'] || pPr.algn
    return algn || 'l' // left по умолчанию
  }

  // Парсинг уровня
  private parseLevel(pPr: any): number {
    const lvl = pPr['@lvl'] || pPr.lvl
    return parseInt(lvl) || 0
  }

  // Парсинг отступов
  private parseSpacing(pPr: any): any {
    const spc = pPr['a:spc'] || pPr.spc || {}
    return {
      before: this.parseEMU(spc['@bef'] || spc.bef),
      after: this.parseEMU(spc['@aft'] || spc.aft),
      line: this.parsePercentage(spc['@ln'] || spc.ln)
    }
  }

  // Парсинг стиля списка
  private parseListStyle(pPr: any): ListStyle | null {
    const numPr = pPr['a:numPr'] || pPr.numPr
    if (!numPr) return null

    const ilvl = numPr['a:ilvl'] || numPr.ilvl
    const numId = numPr['a:numId'] || numPr.numId

    return {
      level: parseInt(ilvl?.['@val'] || ilvl?.val || '0'),
      numberId: parseInt(numId?.['@val'] || numId?.val || '0'),
      type: this.determineListType(numId)
    }
  }

  // Определение типа списка
  private determineListType(numId: any): 'bullet' | 'number' | 'none' {
    // Здесь должна быть логика определения типа списка
    // по numId и соответствующим определениям списков
    return 'bullet'
  }

  // Парсинг отступов
  private parseIndentation(pPr: any): any {
    const indent = pPr['a:ind'] || pPr.ind || {}
    return {
      left: this.parseEMU(indent['@l'] || indent.l),
      right: this.parseEMU(indent['@r'] || indent.r),
      firstLine: this.parseEMU(indent['@fl'] || indent.fl),
      hanging: this.parseEMU(indent['@h'] || indent.h)
    }
  }

  // Парсинг шрифта
  private parseFont(rPr: any): string {
    const font = rPr['@typeface'] || rPr.typeface
    return font || 'Arial'
  }

  // Парсинг размера шрифта
  private parseFontSize(rPr: any): number {
    const size = rPr['@sz'] || rPr.sz
    return this.parseEMU(size) || 12
  }

  // Парсинг цвета
  private parseColor(rPr: any): any {
    const color = rPr['a:solidFill'] || rPr.solidFill
    if (!color) return { r: 0, g: 0, b: 0 }

    const srgbClr = color['a:srgbClr'] || color.srgbClr
    if (srgbClr) {
      const val = srgbClr['@val'] || srgbClr.val
      return this.parseRGBColor(val)
    }

    return { r: 0, g: 0, b: 0 }
  }

  // Парсинг RGB цвета
  private parseRGBColor(hexColor: string): any {
    if (!hexColor || hexColor.length !== 6) {
      return { r: 0, g: 0, b: 0 }
    }

    const r = parseInt(hexColor.substr(0, 2), 16) / 255
    const g = parseInt(hexColor.substr(2, 2), 16) / 255
    const b = parseInt(hexColor.substr(4, 2), 16) / 255

    return { r, g, b }
  }

  // Парсинг жирного шрифта
  private parseBold(rPr: any): boolean {
    const bold = rPr['@b'] || rPr.b
    return bold === '1' || bold === true
  }

  // Парсинг курсива
  private parseItalic(rPr: any): boolean {
    const italic = rPr['@i'] || rPr.i
    return italic === '1' || italic === true
  }

  // Парсинг подчеркивания
  private parseUnderline(rPr: any): string {
    const underline = rPr['@u'] || rPr.u
    return underline || 'none'
  }

  // Парсинг зачеркивания
  private parseStrikethrough(rPr: any): boolean {
    const strike = rPr['@strike'] || rPr.strike
    return strike === 'sngStrike' || strike === true
  }

  // Конвертация EMU в пиксели
  private parseEMU(emuValue: string | number): number {
    if (!emuValue) return 0
    const emu = parseInt(emuValue.toString())
    return emu / 9525 // 914400 / 96 DPI
  }

  // Парсинг процентов
  private parsePercentage(percentValue: string | number): number {
    if (!percentValue) return 100
    const percent = parseInt(percentValue.toString())
    return percent / 1000 // PPTX использует тысячные доли
  }

  // Парсинг гиперссылки
  private parseHyperlink(rElement: any): Hyperlink | undefined {
    const hlinkClick = rElement['a:hlinkClick'] || rElement.hlinkClick
    if (!hlinkClick) return undefined

    const rId = hlinkClick['@r:id'] || hlinkClick.rid
    if (!rId) return undefined

    // TODO: Получить URL из relationships по rId
    // Пока возвращаем заглушку
    return {
      url: `#${rId}`, // Временная заглушка
      tooltip: hlinkClick['@tooltip'] || hlinkClick.tooltip,
      target: '_blank'
    }
  }
}
