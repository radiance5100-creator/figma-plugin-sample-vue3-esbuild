/**
 * @file: PresentationParser.ts
 * @description: Парсер для presentation.xml файла
 * @dependencies: XMLParser, models
 * @created: 2024-12-19
 */

import { XMLParser } from './XMLParser'
import { ModelFactories } from '../../models'

export interface PresentationInfo {
  slideCount: number
  masterCount: number
  themeCount: number
  slideSize: {
    width: number
    height: number
  }
  slideIds: string[]
  masterIds: string[]
  themeIds: string[]
}

export class PresentationParser {
  private xmlParser: XMLParser

  constructor() {
    this.xmlParser = new XMLParser()
  }

  // Парсинг presentation.xml
  parse(xmlContent: string): PresentationInfo {
    try {
      const data = this.xmlParser.parse(xmlContent)
      const presentation = data.presentation

      if (!presentation) {
        throw new Error('Invalid presentation.xml structure: missing presentation element')
      }

      // Парсинг размера слайдов
      const slideSize = this.parseSlideSize(presentation.sldSz)

      // Парсинг списка слайдов
      const slideIds = this.parseSlideIds(presentation.sldIdLst)

      // Парсинг списка мастер-слайдов
      const masterIds = this.parseMasterIds(presentation.sldMasterIdLst)

      // Парсинг списка тем
      const themeIds = this.parseThemeIds(presentation.themeIdLst)

      return {
        slideCount: slideIds.length,
        masterCount: masterIds.length,
        themeCount: themeIds.length,
        slideSize,
        slideIds,
        masterIds,
        themeIds
      }
    } catch (error) {
      console.error('Error parsing presentation.xml:', error)
      throw new Error(`Failed to parse presentation.xml: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Парсинг размера слайдов
  private parseSlideSize(sldSz: any): { width: number; height: number } {
    if (!sldSz) {
      // Стандартный размер 4:3 (10" x 7.5")
      return {
        width: 9144000, // 10 дюймов в EMU
        height: 6858000  // 7.5 дюймов в EMU
      }
    }

    const width = XMLParser.getNumberAttribute(sldSz, 'cx', 9144000)
    const height = XMLParser.getNumberAttribute(sldSz, 'cy', 6858000)

    return { width, height }
  }

  // Парсинг списка ID слайдов
  private parseSlideIds(sldIdLst: any): string[] {
    if (!sldIdLst || !sldIdLst.sldId) {
      return []
    }

    const slideIds = XMLParser.getChildren(sldIdLst, 'sldId')
    return slideIds.map((slideId: any) => {
      const id = XMLParser.getAttribute(slideId, 'id')
      const rid = XMLParser.getAttribute(slideId, 'r:id')
      return { id, rid }
    }).filter((item: any) => item.id && item.rid)
  }

  // Парсинг списка ID мастер-слайдов
  private parseMasterIds(sldMasterIdLst: any): string[] {
    if (!sldMasterIdLst || !sldMasterIdLst.sldMasterId) {
      return []
    }

    const masterIds = XMLParser.getChildren(sldMasterIdLst, 'sldMasterId')
    return masterIds.map((masterId: any) => {
      const id = XMLParser.getAttribute(masterId, 'id')
      const rid = XMLParser.getAttribute(masterId, 'r:id')
      return { id, rid }
    }).filter((item: any) => item.id && item.rid)
  }

  // Парсинг списка ID тем
  private parseThemeIds(themeIdLst: any): string[] {
    if (!themeIdLst || !themeIdLst.themeId) {
      return []
    }

    const themeIds = XMLParser.getChildren(themeIdLst, 'themeId')
    return themeIds.map((themeId: any) => {
      const id = XMLParser.getAttribute(themeId, 'id')
      const rid = XMLParser.getAttribute(themeId, 'r:id')
      return { id, rid }
    }).filter((item: any) => item.id && item.rid)
  }

  // Получение информации о слайдах
  getSlideInfo(presentationInfo: PresentationInfo): {
    slideCount: number
    slideIds: string[]
    slideRels: { [key: string]: string }
  } {
    const slideRels: { [key: string]: string } = {}
    
    presentationInfo.slideIds.forEach((slideId: any) => {
      if (slideId.id && slideId.rid) {
        slideRels[slideId.id] = slideId.rid
      }
    })

    return {
      slideCount: presentationInfo.slideCount,
      slideIds: presentationInfo.slideIds.map((slideId: any) => slideId.id),
      slideRels
    }
  }

  // Получение информации о мастер-слайдах
  getMasterInfo(presentationInfo: PresentationInfo): {
    masterCount: number
    masterIds: string[]
    masterRels: { [key: string]: string }
  } {
    const masterRels: { [key: string]: string } = {}
    
    presentationInfo.masterIds.forEach((masterId: any) => {
      if (masterId.id && masterId.rid) {
        masterRels[masterId.id] = masterId.rid
      }
    })

    return {
      masterCount: presentationInfo.masterCount,
      masterIds: presentationInfo.masterIds.map((masterId: any) => masterId.id),
      masterRels
    }
  }

  // Получение информации о темах
  getThemeInfo(presentationInfo: PresentationInfo): {
    themeCount: number
    themeIds: string[]
    themeRels: { [key: string]: string }
  } {
    const themeRels: { [key: string]: string } = {}
    
    presentationInfo.themeIds.forEach((themeId: any) => {
      if (themeId.id && themeId.rid) {
        themeRels[themeId.id] = themeId.rid
      }
    })

    return {
      themeCount: presentationInfo.themeCount,
      themeIds: presentationInfo.themeIds.map((themeId: any) => themeId.id),
      themeRels
    }
  }

  // Валидация структуры presentation.xml
  validateStructure(data: any): boolean {
    if (!data || !data.presentation) {
      console.error('Invalid presentation.xml: missing presentation element')
      return false
    }

    const presentation = data.presentation

    // Проверяем обязательные элементы
    const requiredElements = ['sldIdLst']
    for (const element of requiredElements) {
      if (!XMLParser.hasElement(presentation, element)) {
        console.warn(`Missing required element in presentation.xml: ${element}`)
      }
    }

    return true
  }

  // Логирование структуры для отладки
  logStructure(data: any): void {
    console.log('=== Presentation.xml Structure ===')
    
    if (data && data.presentation) {
      const presentation = data.presentation
      
      console.log('Slide Size:', this.parseSlideSize(presentation.sldSz))
      console.log('Slide Count:', this.parseSlideIds(presentation.sldIdLst).length)
      console.log('Master Count:', this.parseMasterIds(presentation.sldMasterIdLst).length)
      console.log('Theme Count:', this.parseThemeIds(presentation.themeIdLst).length)
      
      if (presentation.sldIdLst && presentation.sldIdLst.sldId) {
        console.log('Slide IDs:', this.parseSlideIds(presentation.sldIdLst))
      }
    }
    
    console.log('================================')
  }
}
