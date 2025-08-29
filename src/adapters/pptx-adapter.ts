/**
 * @file: pptx-adapter.ts
 * @description: Adapter for ZIP and XML operations (DOM-dependent)
 * @dependencies: core/parser.ts, JSZip, fast-xml-parser
 * @created: 2024-12-19
 */

import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import { CoreParser } from '../core/parser'
import { PPTXData, ParseResult, ParseProgress } from '../shared/types'

// Polyfill for setImmediate in UI context
if (typeof setImmediate === 'undefined') {
  (globalThis as any).setImmediate = (callback: Function, ...args: any[]) => {
    return setTimeout(() => callback(...args), 0)
  }
}

export class PPTXAdapter {
  private zip: JSZip | null = null
  private xmlParser: XMLParser
  private onProgress?: (progress: ParseProgress) => void

  constructor(onProgress?: (progress: ParseProgress) => void) {
    this.onProgress = onProgress
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text',
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: true
    })
  }

  // Main parsing method
  async parsePPTX(fileData: ArrayBuffer, fileName: string): Promise<ParseResult> {
    const startTime = Date.now()
    
    try {
      console.log('PPTXAdapter: Starting parsing for', fileName)
      
      this.updateProgress({
        stage: 'initializing',
        progress: 0,
        message: 'Инициализация парсера...'
      })

      // Load ZIP archive
      await this.loadZipArchive(fileData)
      
      // Parse all components
      const presentation = await this.parsePresentationFile()
      const slides = await this.parseSlideFiles()
      const masters = await this.parseMasterSlideFiles()
      const themes = await this.parseThemeFiles()
      const media = await this.parseMediaFiles()

      // Create result
      const result: PPTXData = {
        fileName,
        fileSize: fileData.byteLength,
        slides,
        masters,
        themes,
        media,
        presentation
      }

      const processingTime = Date.now() - startTime
      console.log('PPTXAdapter: Parsing completed successfully', { result, processingTime })

      this.updateProgress({
        stage: 'completed',
        progress: 100,
        message: 'Парсинг завершен'
      })

      return {
        success: true,
        data: result,
        errors: [],
        warnings: [],
        processingTime
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error('PPTXAdapter: Parsing error', error)
      
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: `Ошибка: ${errorMessage}`
      })

      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        processingTime
      }
    }
  }

  // Load ZIP archive
  private async loadZipArchive(fileData: ArrayBuffer): Promise<void> {
    this.updateProgress({
      stage: 'loading',
      progress: 10,
      message: 'Загрузка ZIP архива...'
    })
    
    this.zip = new JSZip()
    await this.zip.loadAsync(fileData)
  }

  // Parse presentation.xml
  private async parsePresentationFile(): Promise<any> {
    this.updateProgress({
      stage: 'parsing',
      progress: 20,
      message: 'Парсинг presentation.xml...'
    })
    
    const presentationFile = this.zip?.file('ppt/presentation.xml')
    if (!presentationFile) {
      throw new Error('presentation.xml not found')
    }

    const xmlContent = await presentationFile.async('string')
    const xmlData = this.xmlParser.parse(xmlContent)
    
    return CoreParser.parsePresentation(xmlData)
  }

  // Parse slide files
  private async parseSlideFiles(): Promise<any[]> {
    this.updateProgress({
      stage: 'parsing',
      progress: 30,
      message: 'Парсинг слайдов...'
    })
    
    const slides: any[] = []
    const slideFiles = this.getSlideFiles()

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i]
      const slideNumber = i + 1
      
      this.updateProgress({
        stage: 'parsing',
        progress: 30 + (i / slideFiles.length) * 20,
        message: `Парсинг слайда ${slideNumber}/${slideFiles.length}...`
      })

      try {
        const xmlContent = await slideFile.async('string')
        const xmlData = this.xmlParser.parse(xmlContent)
        const slide = CoreParser.parseSlide(xmlData, slideNumber)
        slides.push(slide)
      } catch (error) {
        console.warn(`Error parsing slide ${slideNumber}:`, error)
      }
    }

    return slides
  }

  // Parse master slide files
  private async parseMasterSlideFiles(): Promise<any[]> {
    this.updateProgress({
      stage: 'parsing',
      progress: 50,
      message: 'Парсинг мастер-слайдов...'
    })
    
    const masters: any[] = []
    const masterFiles = this.getMasterSlideFiles()

    for (let i = 0; i < masterFiles.length; i++) {
      const masterFile = masterFiles[i]
      const masterNumber = i + 1
      
      try {
        const xmlContent = await masterFile.async('string')
        const xmlData = this.xmlParser.parse(xmlContent)
        const master = CoreParser.parseMasterSlide(xmlData, masterNumber)
        masters.push(master)
      } catch (error) {
        console.warn(`Error parsing master slide ${masterNumber}:`, error)
      }
    }

    return masters
  }

  // Parse theme files
  private async parseThemeFiles(): Promise<any[]> {
    this.updateProgress({
      stage: 'parsing',
      progress: 60,
      message: 'Парсинг тем...'
    })
    
    const themes: any[] = []
    const themeFiles = this.getThemeFiles()

    for (let i = 0; i < themeFiles.length; i++) {
      const themeFile = themeFiles[i]
      const themeNumber = i + 1
      
      try {
        const xmlContent = await themeFile.async('string')
        const xmlData = this.xmlParser.parse(xmlContent)
        const theme = CoreParser.parseTheme(xmlData, themeNumber)
        themes.push(theme)
      } catch (error) {
        console.warn(`Error parsing theme ${themeNumber}:`, error)
      }
    }

    return themes
  }

  // Parse media files
  private async parseMediaFiles(): Promise<any[]> {
    this.updateProgress({
      stage: 'parsing',
      progress: 70,
      message: 'Парсинг медиа файлов...'
    })
    
    const media: any[] = []
    const mediaFiles = this.getMediaFiles()

    for (const mediaFile of mediaFiles) {
      try {
        const fileData = await mediaFile.async('uint8array')
        const mediaItem = {
          id: `media-${media.length}`,
          name: mediaFile.name.split('/').pop() || 'unknown',
          type: this.getMediaType(mediaFile.name),
          src: mediaFile.name,
          size: fileData.length,
          data: fileData,
          mimeType: this.getMimeType(mediaFile.name)
        }
        media.push(mediaItem)
      } catch (error) {
        console.warn(`Error parsing media file ${mediaFile.name}:`, error)
      }
    }

    return media
  }

  // Helper methods to get file lists
  private getSlideFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/slides/slide') && file.name.endsWith('.xml')
    ).sort((a, b) => {
      const aNum = parseInt(a.name.match(/slide(\d+)/)?.[1] || '0')
      const bNum = parseInt(b.name.match(/slide(\d+)/)?.[1] || '0')
      return aNum - bNum
    })
  }

  private getMasterSlideFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/slideMasters/slideMaster') && file.name.endsWith('.xml')
    ).sort((a, b) => {
      const aNum = parseInt(a.name.match(/slideMaster(\d+)/)?.[1] || '0')
      const bNum = parseInt(b.name.match(/slideMaster(\d+)/)?.[1] || '0')
      return aNum - bNum
    })
  }

  private getThemeFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/theme/theme') && file.name.endsWith('.xml')
    ).sort((a, b) => {
      const aNum = parseInt(a.name.match(/theme(\d+)/)?.[1] || '0')
      const bNum = parseInt(b.name.match(/theme(\d+)/)?.[1] || '0')
      return aNum - bNum
    })
  }

  private getMediaFiles(): JSZip.JSZipObject[] {
    if (!this.zip) return []
    
    return Object.values(this.zip.files).filter(file => 
      file.name.startsWith('ppt/media/') && !file.dir
    )
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

  private updateProgress(progress: ParseProgress): void {
    this.onProgress?.(progress)
  }
}
