/**
 * @file: PPTXParser.ts
 * @description: Основной класс для парсинга PPTX файлов
 * @dependencies: types.ts, utils.ts, JSZip
 * @created: 2024-12-19
 */

import JSZip from 'jszip'
import { PPTXFile, ParseResult, ParserState, Slide, MasterSlide, Theme, MediaFile } from './types'
import { parseXML, emuToPixels, generateId, logParseStep, logParseError, createParseError } from './utils'
import { ModelFactories, ModelUtils, Presentation as DomainPresentation } from '../models'
import { PresentationParser, SlideParser, XMLUtils, ThemeParser } from './xml'
import { ThemeCache } from '../models/ThemeCache'
import { ElementMapper } from '../mapper/ElementMapper'

export class PPTXParser {
  private state: ParserState = {
    isParsing: false,
    progress: 0,
    currentStep: '',
    errors: [],
    warnings: []
  }

  private zip: JSZip | null = null
  private onProgress?: (state: ParserState) => void

  constructor(onProgress?: (state: ParserState) => void) {
    this.onProgress = onProgress
  }

  // Основной метод парсинга
  async parse(fileData: ArrayBuffer, fileName: string): Promise<ParseResult> {
    const startTime = Date.now()
    
    try {
      this.updateState({
        isParsing: true,
        progress: 0,
        currentStep: 'Инициализация парсера...',
        errors: [],
        warnings: []
      })

      logParseStep('Starting PPTX parsing', { fileName, fileSize: fileData.byteLength })

      // Загрузка ZIP архива
      await this.loadZipArchive(fileData)
      
      // Парсинг основных файлов
      const presentation = await this.parsePresentation()
      const slides = await this.parseSlides()
      const masters = await this.parseMasterSlides()
      const themes = await this.parseThemes()
      const media = await this.parseMediaFiles()

      // Создание результата
      const result: PPTXFile = {
        fileName,
        fileSize: fileData.byteLength,
        slides,
        masters,
        themes,
        media,
        presentation
      }

      const processingTime = Date.now() - startTime

      this.updateState({
        isParsing: false,
        progress: 100,
        currentStep: 'Парсинг завершен'
      })

      logParseStep('Parsing completed', { processingTime, slidesCount: slides.length })

      return {
        success: true,
        data: result,
        errors: this.state.errors,
        warnings: this.state.warnings,
        processingTime
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logParseError(error as Error, 'PPTXParser.parse')
      
      this.updateState({
        isParsing: false,
        progress: 0,
        currentStep: 'Ошибка парсинга'
      })

      return {
        success: false,
        errors: [...this.state.errors, errorMessage],
        warnings: this.state.warnings,
        processingTime
      }
    }
  }

  // Загрузка ZIP архива
  private async loadZipArchive(fileData: ArrayBuffer): Promise<void> {
    this.updateState({ currentStep: 'Загрузка ZIP архива...', progress: 10 })
    
    try {
      this.zip = new JSZip()
      await this.zip.loadAsync(fileData)
      
      logParseStep('ZIP archive loaded', { fileCount: Object.keys(this.zip.files).length })
    } catch (error) {
      throw createParseError('Failed to load ZIP archive', 'loadZipArchive')
    }
  }

  // Парсинг presentation.xml
  private async parsePresentation(): Promise<any> {
    this.updateState({ currentStep: 'Парсинг presentation.xml...', progress: 20 })
    
    try {
      const presentationFile = this.zip?.file(XMLUtils.PATHS.PRESENTATION)
      if (!presentationFile) {
        throw createParseError('presentation.xml not found', 'parsePresentation')
      }

      const xmlContent = await presentationFile.async('string')
      const presentationParser = new PresentationParser()
      const presentationInfo = presentationParser.parse(xmlContent)

      logParseStep('Presentation parsed', { 
        slideCount: presentationInfo.slideCount,
        masterCount: presentationInfo.masterCount,
        themeCount: presentationInfo.themeCount
      })

      return {
        slideSize: presentationInfo.slideSize,
        slideCount: presentationInfo.slideCount,
        masterCount: presentationInfo.masterCount,
        themeCount: presentationInfo.themeCount,
        slideIds: presentationInfo.slideIds,
        masterIds: presentationInfo.masterIds,
        themeIds: presentationInfo.themeIds
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw createParseError(`Failed to parse presentation.xml: ${errorMessage}`, 'parsePresentation')
    }
  }

  // Парсинг слайдов
  private async parseSlides(): Promise<Slide[]> {
    this.updateState({ currentStep: 'Парсинг слайдов...', progress: 40 })
    
    try {
      const slides: Slide[] = []
      const slideFiles = this.getSlideFiles()

      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i]
        const slideNumber = i + 1
        
        this.updateState({ 
          currentStep: `Парсинг слайда ${slideNumber}/${slideFiles.length}...`,
          progress: 40 + (i / slideFiles.length) * 20
        })

        try {
          const slide = await this.parseSlide(slideFile, slideNumber)
          slides.push(slide)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          this.state.warnings.push(`Ошибка парсинга слайда ${slideNumber}: ${errorMessage}`)
          logParseError(error as Error, `parseSlide ${slideNumber}`)
        }
      }

      logParseStep('Slides parsed', { count: slides.length })
      return slides
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw createParseError(`Failed to parse slides: ${errorMessage}`, 'parseSlides')
    }
  }

  // Парсинг мастер-слайдов
  private async parseMasterSlides(): Promise<MasterSlide[]> {
    this.updateState({ currentStep: 'Парсинг мастер-слайдов...', progress: 60 })
    
    try {
      const masters: MasterSlide[] = []
      const masterFiles = this.getMasterSlideFiles()

      for (let i = 0; i < masterFiles.length; i++) {
        const masterFile = masterFiles[i]
        
        try {
          const master = await this.parseMasterSlide(masterFile)
          masters.push(master)
        } catch (error) {
          this.state.warnings.push(`Ошибка парсинга мастер-слайда ${i + 1}: ${error.message}`)
          logParseError(error as Error, `parseMasterSlide ${i + 1}`)
        }
      }

      logParseStep('Master slides parsed', { count: masters.length })
      return masters
    } catch (error) {
      throw createParseError(`Failed to parse master slides: ${error.message}`, 'parseMasterSlides')
    }
  }

  // Парсинг тем
  private async parseThemes(): Promise<Theme[]> {
    this.updateState({ currentStep: 'Парсинг тем...', progress: 70 })
    
    try {
      const themes: Theme[] = []
      const themeFiles = this.getThemeFiles()

      for (let i = 0; i < themeFiles.length; i++) {
        const themeFile = themeFiles[i]
        
        try {
          const theme = await this.parseTheme(themeFile)
          themes.push(theme)
        } catch (error) {
          this.state.warnings.push(`Ошибка парсинга темы ${i + 1}: ${error.message}`)
          logParseError(error as Error, `parseTheme ${i + 1}`)
        }
      }

      logParseStep('Themes parsed', { count: themes.length })
      return themes
    } catch (error) {
      throw createParseError(`Failed to parse themes: ${error.message}`, 'parseThemes')
    }
  }

  // Парсинг медиа файлов
  private async parseMediaFiles(): Promise<MediaFile[]> {
    this.updateState({ currentStep: 'Парсинг медиа файлов...', progress: 80 })
    
    try {
      const media: MediaFile[] = []
      const mediaFiles = this.getMediaFiles()

      for (const mediaFile of mediaFiles) {
        try {
          const mediaItem = await this.parseMediaFile(mediaFile)
          media.push(mediaItem)
        } catch (error) {
          this.state.warnings.push(`Ошибка парсинга медиа файла ${mediaFile.name}: ${error.message}`)
          logParseError(error as Error, `parseMediaFile ${mediaFile.name}`)
        }
      }

      logParseStep('Media files parsed', { count: media.length })
      return media
    } catch (error) {
      throw createParseError(`Failed to parse media files: ${error.message}`, 'parseMediaFiles')
    }
  }

  // Вспомогательные методы
  private getSlideFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/slides/slide') && file.name.endsWith('.xml')
    )
  }

  private getMasterSlideFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/slideMasters/slideMaster') && file.name.endsWith('.xml')
    )
  }

  private getThemeFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/theme/theme') && file.name.endsWith('.xml')
    )
  }

  private getMediaFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/media/') && !file.dir
    )
  }

  // Парсинг отдельного слайда
  private async parseSlide(slideFile: JSZip.JSZipObject, slideNumber: number): Promise<Slide> {
    try {
      const xmlContent = await slideFile.async('string')
      const slideParser = new SlideParser()
      const slideData = slideParser.parse(xmlContent, slideNumber)

      return {
        id: slideData.id,
        name: slideData.name,
        number: slideData.number,
        elements: slideData.elements,
        background: slideData.background,
        layout: slideData.layout
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to parse slide ${slideNumber}: ${errorMessage}`)
    }
  }

  private async parseMasterSlide(masterFile: JSZip.JSZipObject): Promise<MasterSlide> {
    const xmlContent = await masterFile.async('string')
    const masterData = parseXML(xmlContent)

    return {
      id: generateId(),
      name: 'Master Slide',
      elements: [], // Будет реализовано позже
      layouts: [] // Будет реализовано позже
    }
  }

  private async parseTheme(themeFile: JSZip.JSZipObject): Promise<Theme> {
    const xmlContent = await themeFile.async('string')
    const themeData = parseXML(xmlContent)

    return {
      id: generateId(),
      name: 'Theme',
      colors: {
        primary: [],
        accent: [],
        background: [],
        text: []
      },
      fonts: {
        major: { name: 'Arial' },
        minor: { name: 'Arial' }
      }
    }
  }

  private async parseMediaFile(mediaFile: JSZip.JSZipObject): Promise<MediaFile> {
    const fileData = await mediaFile.async('uint8array')
    
    return {
      id: generateId(),
      name: mediaFile.name.split('/').pop() || 'unknown',
      type: this.getMediaType(mediaFile.name),
      src: mediaFile.name,
      size: fileData.length,
      mimeType: this.getMimeType(mediaFile.name)
    }
  }

  private parseSlideSize(sldSz: any): { width: number; height: number } {
    if (!sldSz) {
      return { width: 9144000, height: 6858000 } // 10" x 7.5" в EMU
    }

    const width = parseInt(sldSz['@attributes']?.cx || '9144000')
    const height = parseInt(sldSz['@attributes']?.cy || '6858000')

    return {
      width: emuToPixels(width),
      height: emuToPixels(height)
    }
  }

  private getMediaType(fileName: string): 'image' | 'video' | 'audio' {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext || '')) {
      return 'image'
    }
    
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) {
      return 'video'
    }
    
    return 'audio'
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv'
    }
    
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  // Обновление состояния
  private updateState(updates: Partial<ParserState>): void {
    this.state = { ...this.state, ...updates }
    this.onProgress?.(this.state)
  }

  // Получение текущего состояния
  getState(): ParserState {
    return { ...this.state }
  }

  /**
   * Маппинг слайда в доменные модели
   */
  async mapSlide(slideXml: string, slideIndex: number, slideId: string, scale: number = 1.0) {
    try {
      const elementMapper = new ElementMapper();
      const mappingResult = await elementMapper.mapSlide(slideXml, slideIndex, slideId, scale);
      
      return {
        success: true,
        elements: mappingResult.elements,
        warnings: mappingResult.warnings,
        errors: mappingResult.errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown mapping error';
      return {
        success: false,
        elements: [],
        warnings: [],
        errors: [errorMessage]
      };
    }
  }
}
