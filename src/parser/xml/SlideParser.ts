/**
 * @file: SlideParser.ts
 * @description: Парсер для slide*.xml файлов
 * @dependencies: XMLParser, models
 * @created: 2024-12-19
 */

import { XMLParser } from './XMLParser'
import { TextParser } from './TextParser'
import { ModelFactories, Element, TextElement, ShapeElement, ImageElement, GroupElement, LineElement } from '../../models'

export interface SlideData {
  id: string
  name: string
  number: number
  elements: Element[]
  background: any
  layout: any
  masterSlideId?: string
  layoutId?: string
}

export class SlideParser {
  private xmlParser: XMLParser
  private textParser: TextParser

  constructor() {
    this.xmlParser = new XMLParser()
    this.textParser = new TextParser()
  }

  // Парсинг slide*.xml
  parse(xmlContent: string, slideNumber: number): SlideData {
    try {
      const data = this.xmlParser.parse(xmlContent)
      const slide = data['p:sld']?.['p:sld']

      if (!slide) {
        throw new Error('Invalid slide.xml structure: missing p:sld element')
      }

      // Парсинг основных свойств слайда
      const slideId = XMLParser.getAttribute(slide, 'id') || `slide-${slideNumber}`
      const slideName = XMLParser.getAttribute(slide, 'name') || `Slide ${slideNumber}`

      // Парсинг элементов слайда
      const elements = this.parseElements(slide)

      // Парсинг фона слайда
      const background = this.parseBackground(slide)

      // Парсинг макета
      const layout = this.parseLayout(slide)

      return {
        id: slideId,
        name: slideName,
        number: slideNumber,
        elements,
        background,
        layout
      }
    } catch (error) {
      console.error('Error parsing slide.xml:', error)
      throw new Error(`Failed to parse slide.xml: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Парсинг элементов слайда
  private parseElements(slide: any): Element[] {
    const elements: Element[] = []
    
    // Парсинг spTree (Shape Tree)
    const spTree = XMLParser.getChild(slide, 'p:spTree')
    if (spTree) {
      const shapeElements = this.parseShapeTree(spTree)
      elements.push(...shapeElements)
    }

    // Парсинг графических элементов
    const graphicFrame = XMLParser.getChild(slide, 'p:graphicFrame')
    if (graphicFrame) {
      const graphicElements = this.parseGraphicFrame(graphicFrame)
      elements.push(...graphicElements)
    }

    return elements
  }

  // Парсинг дерева фигур
  private parseShapeTree(spTree: any): Element[] {
    const elements: Element[] = []
    
    // Парсинг фигур (sp)
    const shapes = XMLParser.getChildren(spTree, 'p:sp')
    for (const shape of shapes) {
      const element = this.parseShape(shape)
      if (element) {
        elements.push(element)
      }
    }

    // Парсинг групп (grpSp)
    const groups = XMLParser.getChildren(spTree, 'p:grpSp')
    for (const group of groups) {
      const element = this.parseGroup(group)
      if (element) {
        elements.push(element)
      }
    }

    // Парсинг изображений (pic)
    const pictures = XMLParser.getChildren(spTree, 'p:pic')
    for (const picture of pictures) {
      const element = this.parsePicture(picture)
      if (element) {
        elements.push(element)
      }
    }

    return elements
  }

  // Парсинг фигуры
  private parseShape(sp: any): Element | null {
    try {
      // Получение позиции и размера
      const spPr = XMLParser.getChild(sp, 'p:spPr')
      if (!spPr) return null

      const xfrm = XMLParser.getChild(spPr, 'a:xfrm')
      const position = xfrm ? XMLParser.getPosition(xfrm) : ModelFactories.createPoint(0, 0)
      const size = xfrm ? XMLParser.getSize(xfrm) : ModelFactories.createSize(100, 100)

      // Проверка наличия текста
      const txBody = XMLParser.getChild(sp, 'p:txBody')
      if (txBody) {
        // Если есть текст, создаем текстовый элемент
        return this.parseTextShape(sp, position, size)
      }

      // Получение типа фигуры
      const prstGeom = XMLParser.getChild(spPr, 'a:prstGeom')
      const shapeType = this.getShapeType(prstGeom)

      // Получение стилей
      const fill = this.parseFill(spPr)
      const stroke = this.parseStroke(spPr)

      // Создание элемента фигуры
      return ModelFactories.createShapeElement(position, size, shapeType, {
        fill,
        stroke
      })
    } catch (error) {
      console.error('Error parsing shape:', error)
      return null
    }
  }

  // Парсинг фигуры с текстом
  private parseTextShape(sp: any, position: any, size: any): TextElement | null {
    try {
      const txBody = XMLParser.getChild(sp, 'p:txBody')
      if (!txBody) return null

      // Конвертация txBody в XML строку для TextParser
      const txBodyXml = this.convertToXmlString(txBody, 'a:txBody')
      
      // Парсинг текста с помощью TextParser
      const textResult = this.textParser.parseTextBody(txBodyXml)
      
      if (!textResult.success || textResult.paragraphs.length === 0) {
        console.warn('Failed to parse text body or no paragraphs found')
        return null
      }

      // Получение свойств текстового блока
      const bodyPr = XMLParser.getChild(txBody, 'a:bodyPr')
      const autoFit = bodyPr ? this.parseAutoFit(bodyPr) : false
      const wordWrap = bodyPr ? this.parseWordWrap(bodyPr) : true
      const verticalAlignment = bodyPr ? this.parseVerticalAlignment(bodyPr) : 'top'

      // Создание текстового элемента
      return ModelFactories.createTextElement(position, size, textResult.paragraphs, {
        autoFit,
        wordWrap,
        verticalAlignment
      })

    } catch (error) {
      console.error('Error parsing text shape:', error)
      return null
    }
  }

  // Конвертация объекта в XML строку
  private convertToXmlString(obj: any, rootTag: string): string {
    // Более правильная конвертация для txBody
    if (!obj) return `<${rootTag}></${rootTag}>`
    
    // Если объект уже является строкой XML, возвращаем как есть
    if (typeof obj === 'string' && obj.trim().startsWith('<')) {
      return obj
    }
    
    // Простая конвертация в XML формат
    const xmlContent = this.objectToXml(obj)
    return `<${rootTag}>${xmlContent}</${rootTag}>`
  }

  // Конвертация объекта в XML
  private objectToXml(obj: any): string {
    if (typeof obj === 'string') {
      return obj
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj.toString()
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.objectToXml(item)).join('')
    }
    
    if (typeof obj === 'object' && obj !== null) {
      let result = ''
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          result += `<${key}>${this.objectToXml(value)}</${key}>`
        }
      }
      return result
    }
    
    return ''
  }

  // Парсинг авто-подгонки текста
  private parseAutoFit(bodyPr: any): boolean {
    const normAutofit = XMLParser.getChild(bodyPr, 'a:normAutofit')
    const spAutofit = XMLParser.getChild(bodyPr, 'a:spAutofit')
    return !!(normAutofit || spAutofit)
  }

  // Парсинг переноса слов
  private parseWordWrap(bodyPr: any): boolean {
    const wrap = XMLParser.getAttribute(bodyPr, 'wrap')
    return wrap !== 'none'
  }

  // Парсинг вертикального выравнивания
  private parseVerticalAlignment(bodyPr: any): 'top' | 'middle' | 'bottom' {
    const anchor = XMLParser.getAttribute(bodyPr, 'anchor')
    switch (anchor) {
      case 'ctr': return 'middle'
      case 'b': return 'bottom'
      default: return 'top'
    }
  }

  // Парсинг группы
  private parseGroup(grpSp: any): Element | null {
    try {
      // Получение позиции и размера группы
      const grpSpPr = XMLParser.getChild(grpSp, 'p:grpSpPr')
      const xfrm = grpSpPr ? XMLParser.getChild(grpSpPr, 'a:xfrm') : null
      const position = xfrm ? XMLParser.getPosition(xfrm) : ModelFactories.createPoint(0, 0)
      const size = xfrm ? XMLParser.getSize(xfrm) : ModelFactories.createSize(100, 100)

      // Парсинг дочерних элементов группы
      const children: Element[] = []
      const spTree = XMLParser.getChild(grpSp, 'p:spTree')
      if (spTree) {
        const childElements = this.parseShapeTree(spTree)
        children.push(...childElements)
      }

      // Создание элемента группы
      return ModelFactories.createGroupElement(position, size, children)
    } catch (error) {
      console.error('Error parsing group:', error)
      return null
    }
  }

  // Парсинг изображения
  private parsePicture(pic: any): Element | null {
    try {
      // Получение позиции и размера
      const spPr = XMLParser.getChild(pic, 'p:spPr')
      const xfrm = spPr ? XMLParser.getChild(spPr, 'a:xfrm') : null
      const position = xfrm ? XMLParser.getPosition(xfrm) : ModelFactories.createPoint(0, 0)
      const size = xfrm ? XMLParser.getSize(xfrm) : ModelFactories.createSize(100, 100)

      // Получение источника изображения
      const blipFill = XMLParser.getChild(spPr, 'a:blipFill')
      const blip = blipFill ? XMLParser.getChild(blipFill, 'a:blip') : null
      const src = blip ? (XMLParser.getAttribute(blip, 'r:embed') || '') : ''

      // Создание элемента изображения
      return ModelFactories.createImageElement(position, size, src)
    } catch (error) {
      console.error('Error parsing picture:', error)
      return null
    }
  }

  // Парсинг графического фрейма
  private parseGraphicFrame(graphicFrame: any): Element[] {
    const elements: Element[] = []
    
    // Парсинг графических данных
    const graphic = XMLParser.getChild(graphicFrame, 'a:graphic')
    if (graphic) {
      const graphicData = XMLParser.getChild(graphic, 'a:graphicData')
      if (graphicData) {
        // Парсинг таблиц
        const table = XMLParser.getChild(graphicData, 'a:tbl')
        if (table) {
          const tableElement = this.parseTable(table)
          if (tableElement) {
            elements.push(tableElement)
          }
        }

        // Парсинг диаграмм
        const chart = XMLParser.getChild(graphicData, 'c:chart')
        if (chart) {
          const chartElement = this.parseChart(chart)
          if (chartElement) {
            elements.push(chartElement)
          }
        }
      }
    }

    return elements
  }

  // Парсинг таблицы (заглушка)
  private parseTable(table: any): Element | null {
    // TODO: Реализовать парсинг таблиц
    console.log('Table parsing not implemented yet')
    return null
  }

  // Парсинг диаграммы (заглушка)
  private parseChart(chart: any): Element | null {
    // TODO: Реализовать парсинг диаграмм
    console.log('Chart parsing not implemented yet')
    return null
  }

  // Получение типа фигуры
  private getShapeType(prstGeom: any): ShapeElement['shapeType'] {
    if (!prstGeom) return 'rectangle'

    const prst = XMLParser.getAttribute(prstGeom, 'prst')
    
    switch (prst) {
      case 'rect':
        return 'rectangle'
      case 'ellipse':
        return 'ellipse'
      case 'triangle':
        return 'triangle'
      case 'line':
        return 'line'
      case 'arrow':
        return 'arrow'
      case 'star':
        return 'star'
      default:
        return 'rectangle'
    }
  }

  // Парсинг заливки
  private parseFill(spPr: any): any {
    const fill = XMLParser.getChild(spPr, 'a:fill')
    if (!fill) {
      return ModelFactories.createFillStyle({ type: 'none' })
    }

    // Сплошная заливка
    if (fill.solidFill) {
      const color = XMLParser.getColor(fill.solidFill)
      return ModelFactories.createFillStyle({
        type: 'solid',
        color
      })
    }

    // Градиентная заливка
    if (fill.gradFill) {
      return ModelFactories.createFillStyle({
        type: 'gradient'
        // TODO: Реализовать парсинг градиентов
      })
    }

    // Заливка изображением
    if (fill.blipFill) {
      const blip = XMLParser.getChild(fill.blipFill, 'a:blip')
      const src = blip ? XMLParser.getAttribute(blip, 'r:embed') : ''
      return ModelFactories.createFillStyle({
        type: 'image',
        imageUrl: src
      })
    }

    return ModelFactories.createFillStyle({ type: 'none' })
  }

  // Парсинг обводки
  private parseStroke(spPr: any): any {
    const ln = XMLParser.getChild(spPr, 'a:ln')
    if (!ln) {
      return ModelFactories.createStrokeStyle({ type: 'none' })
    }

    const width = XMLParser.getLineWidth(ln)
    const color = XMLParser.getColor(ln)
    const lineType = XMLParser.getLineType(ln)

    return ModelFactories.createStrokeStyle({
      type: lineType,
      color: color || ModelFactories.createRGBColor(0, 0, 0),
      width
    })
  }

  // Парсинг фона слайда
  private parseBackground(slide: any): any {
    const bg = XMLParser.getChild(slide, 'p:bg')
    if (!bg) {
      return ModelFactories.createSlideBackground()
    }

    const bgPr = XMLParser.getChild(bg, 'p:bgPr')
    if (!bgPr) {
      return ModelFactories.createSlideBackground()
    }

    const fill = XMLParser.getChild(bgPr, 'a:fill')
    if (!fill) {
      return ModelFactories.createSlideBackground()
    }

    // Сплошной фон
    if (fill.solidFill) {
      const color = XMLParser.getColor(fill.solidFill)
      return ModelFactories.createSlideBackground({
        type: 'solid',
        color
      })
    }

    // Градиентный фон
    if (fill.gradFill) {
      return ModelFactories.createSlideBackground({
        type: 'gradient'
        // TODO: Реализовать парсинг градиентов
      })
    }

    return ModelFactories.createSlideBackground()
  }

  // Парсинг макета
  private parseLayout(slide: any): any {
    const layout = XMLParser.getChild(slide, 'p:sldLayoutId')
    if (!layout) {
      return null
    }

    const id = XMLParser.getAttribute(layout, 'id')
    const rid = XMLParser.getAttribute(layout, 'r:id')

    return {
      id,
      rid
    }
  }

  // Валидация структуры slide.xml
  validateStructure(data: any): boolean {
    if (!data || !data['p:sld'] || !data['p:sld']['p:sld']) {
      console.error('Invalid slide.xml: missing p:sld element')
      return false
    }

    return true
  }

  // Логирование структуры для отладки
  logStructure(data: any): void {
    console.log('=== Slide.xml Structure ===')
    
    if (data && data['p:sld'] && data['p:sld']['p:sld']) {
      const slide = data['p:sld']['p:sld']
      
      console.log('Slide ID:', XMLParser.getAttribute(slide, 'id'))
      console.log('Slide Name:', XMLParser.getAttribute(slide, 'name'))
      
      const spTree = XMLParser.getChild(slide, 'p:spTree')
      if (spTree) {
        const shapes = XMLParser.getChildren(spTree, 'p:sp')
        const groups = XMLParser.getChildren(spTree, 'p:grpSp')
        const pictures = XMLParser.getChildren(spTree, 'p:pic')
        
        console.log('Shapes count:', shapes.length)
        console.log('Groups count:', groups.length)
        console.log('Pictures count:', pictures.length)
      }
    }
    
    console.log('==========================')
  }
}
