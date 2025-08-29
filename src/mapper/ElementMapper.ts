/**
 * @file: ElementMapper.ts
 * @description: Основной класс для маппинга XML элементов PPTX в доменные модели
 * @dependencies: models/, parser/xml/
 * @created: 2024-12-19
 */

import { 
  TextElement, 
  ShapeElement, 
  ImageElement, 
  GroupElement, 
  LineElement,
  SlideElement,
  ColorInfo,
  FontInfo
} from '../models/types';
import { ModelFactories } from '../models/factories';
import { ModelUtils } from '../models/utils';
import { ThemeCache } from '../models/ThemeCache';
import { XMLParser } from '../parser/xml/XMLParser';
import { SlideParser } from '../parser/xml/SlideParser';
import { TextParser } from '../parser/xml/TextParser';
import { ThemeParser } from '../parser/xml/ThemeParser';

export interface MappingContext {
  themeCache: ThemeCache;
  slideIndex: number;
  slideId: string;
  scale: number;
  slideWidth: number;
  slideHeight: number;
}

export interface MappingResult {
  elements: SlideElement[];
  warnings: string[];
  errors: string[];
}

export class ElementMapper {
  private themeCache: ThemeCache;
  private xmlParser: XMLParser;
  private slideParser: SlideParser;
  private textParser: TextParser;
  private themeParser: ThemeParser;

  constructor() {
    this.themeCache = new ThemeCache();
    this.xmlParser = new XMLParser();
    this.slideParser = new SlideParser();
    this.textParser = new TextParser();
    this.themeParser = new ThemeParser();
  }

  /**
   * Основной метод маппинга слайда
   */
  async mapSlide(
    slideXml: string, 
    slideIndex: number, 
    slideId: string,
    scale: number = 1.0
  ): Promise<MappingResult> {
    const context: MappingContext = {
      themeCache: this.themeCache,
      slideIndex,
      slideId,
      scale,
      slideWidth: 1920,
      slideHeight: 1080
    };

    const result: MappingResult = {
      elements: [],
      warnings: [],
      errors: []
    };

    try {
      // Парсим XML слайда
      const slideData = this.xmlParser.parseSlide(slideXml);
      
      // Маппим элементы слайда
      const mappedElements = await this.mapSlideElements(slideData, context);
      result.elements = mappedElements;

      // Применяем темы и стили
      await this.applyThemes(result.elements, context);

    } catch (error) {
      result.errors.push(`Ошибка маппинга слайда ${slideIndex}: ${error}`);
    }

    return result;
  }

  /**
   * Маппинг элементов слайда
   */
  private async mapSlideElements(
    slideData: any, 
    context: MappingContext
  ): Promise<SlideElement[]> {
    const elements: SlideElement[] = [];

    // Маппим фигуры
    if (slideData.shapes) {
      for (const shape of slideData.shapes) {
        const mappedShape = await this.mapShape(shape, context);
        if (mappedShape) {
          elements.push(mappedShape);
        }
      }
    }

    // Маппим группы
    if (slideData.groups) {
      for (const group of slideData.groups) {
        const mappedGroup = await this.mapGroup(group, context);
        if (mappedGroup) {
          elements.push(mappedGroup);
        }
      }
    }

    // Маппим изображения
    if (slideData.images) {
      for (const image of slideData.images) {
        const mappedImage = await this.mapImage(image, context);
        if (mappedImage) {
          elements.push(mappedImage);
        }
      }
    }

    return elements;
  }

  /**
   * Маппинг фигуры
   */
  private async mapShape(shapeData: any, context: MappingContext): Promise<ShapeElement | null> {
    try {
      const shape = ModelFactories.createShapeElement({
        id: shapeData.id || `shape_${Date.now()}`,
        type: this.mapShapeType(shapeData.type),
        x: this.convertEMUToPixels(shapeData.x || 0) * context.scale,
        y: this.convertEMUToPixels(shapeData.y || 0) * context.scale,
        width: this.convertEMUToPixels(shapeData.width || 0) * context.scale,
        height: this.convertEMUToPixels(shapeData.height || 0) * context.scale,
        rotation: shapeData.rotation || 0,
        fill: this.mapFill(shapeData.fill),
        stroke: this.mapStroke(shapeData.stroke),
        opacity: shapeData.opacity || 1.0
      });

      // Маппим текст внутри фигуры
      if (shapeData.text) {
        const textElement = await this.mapText(shapeData.text, context);
        if (textElement) {
          shape.text = textElement;
        }
      }

      return shape;
    } catch (error) {
      console.warn('Ошибка маппинга фигуры:', error);
      return null;
    }
  }

  /**
   * Маппинг группы элементов
   */
  private async mapGroup(groupData: any, context: MappingContext): Promise<GroupElement | null> {
    try {
      const group = ModelFactories.createGroupElement({
        id: groupData.id || `group_${Date.now()}`,
        x: this.convertEMUToPixels(groupData.x || 0) * context.scale,
        y: this.convertEMUToPixels(groupData.y || 0) * context.scale,
        width: this.convertEMUToPixels(groupData.width || 0) * context.scale,
        height: this.convertEMUToPixels(groupData.height || 0) * context.scale,
        rotation: groupData.rotation || 0
      });

      // Маппим дочерние элементы
      if (groupData.children) {
        for (const child of groupData.children) {
          const mappedChild = await this.mapSlideElements([child], context);
          if (mappedChild.length > 0) {
            group.children.push(...mappedChild);
          }
        }
      }

      return group;
    } catch (error) {
      console.warn('Ошибка маппинга группы:', error);
      return null;
    }
  }

  /**
   * Маппинг изображения
   */
  private async mapImage(imageData: any, context: MappingContext): Promise<ImageElement | null> {
    try {
      const image = ModelFactories.createImageElement({
        id: imageData.id || `image_${Date.now()}`,
        x: this.convertEMUToPixels(imageData.x || 0) * context.scale,
        y: this.convertEMUToPixels(imageData.y || 0) * context.scale,
        width: this.convertEMUToPixels(imageData.width || 0) * context.scale,
        height: this.convertEMUToPixels(imageData.height || 0) * context.scale,
        rotation: imageData.rotation || 0,
        src: imageData.src,
        alt: imageData.alt || '',
        opacity: imageData.opacity || 1.0
      });

      return image;
    } catch (error) {
      console.warn('Ошибка маппинга изображения:', error);
      return null;
    }
  }

  /**
   * Маппинг текста
   */
  private async mapText(textData: any, context: MappingContext): Promise<TextElement | null> {
    try {
      const textElement = ModelFactories.createTextElement({
        id: textData.id || `text_${Date.now()}`,
        x: this.convertEMUToPixels(textData.x || 0) * context.scale,
        y: this.convertEMUToPixels(textData.y || 0) * context.scale,
        width: this.convertEMUToPixels(textData.width || 0) * context.scale,
        height: this.convertEMUToPixels(textData.height || 0) * context.scale,
        content: textData.content || '',
        fontSize: this.convertPointsToPixels(textData.fontSize || 12) * context.scale,
        fontFamily: textData.fontFamily || 'Arial',
        fontWeight: textData.fontWeight || 'normal',
        fontStyle: textData.fontStyle || 'normal',
        color: this.mapColor(textData.color),
        alignment: textData.alignment || 'left',
        opacity: textData.opacity || 1.0
      });

      // Маппим параграфы и runs
      if (textData.paragraphs) {
        textElement.paragraphs = await this.mapParagraphs(textData.paragraphs, context);
      }

      return textElement;
    } catch (error) {
      console.warn('Ошибка маппинга текста:', error);
      return null;
    }
  }

  /**
   * Маппинг параграфов
   */
  private async mapParagraphs(paragraphsData: any[], context: MappingContext): Promise<any[]> {
    return paragraphsData.map(paragraph => ({
      alignment: paragraph.alignment || 'left',
      indent: this.convertEMUToPixels(paragraph.indent || 0) * context.scale,
      lineHeight: paragraph.lineHeight || 1.2,
      runs: this.mapTextRuns(paragraph.runs || [], context)
    }));
  }

  /**
   * Маппинг текстовых runs
   */
  private mapTextRuns(runsData: any[], context: MappingContext): any[] {
    return runsData.map(run => ({
      text: run.text || '',
      fontSize: this.convertPointsToPixels(run.fontSize || 12) * context.scale,
      fontFamily: run.fontFamily || 'Arial',
      fontWeight: run.fontWeight || 'normal',
      fontStyle: run.fontStyle || 'normal',
      color: this.mapColor(run.color),
      bold: run.bold || false,
      italic: run.italic || false,
      underline: run.underline || false
    }));
  }

  /**
   * Применение тем к элементам
   */
  private async applyThemes(elements: SlideElement[], context: MappingContext): Promise<void> {
    for (const element of elements) {
      await this.applyThemeToElement(element, context);
    }
  }

  /**
   * Применение темы к элементу
   */
  private async applyThemeToElement(element: SlideElement, context: MappingContext): Promise<void> {
    // Применяем тему к тексту
    if (element.type === 'text' && element.text) {
      const theme = await context.themeCache.getTheme(context.slideId);
      if (theme) {
        this.applyTextTheme(element.text, theme);
      }
    }

    // Применяем тему к фигуре
    if (element.type === 'shape') {
      const theme = await context.themeCache.getTheme(context.slideId);
      if (theme) {
        this.applyShapeTheme(element, theme);
      }
    }

    // Рекурсивно применяем к дочерним элементам
    if (element.type === 'group' && element.children) {
      for (const child of element.children) {
        await this.applyThemeToElement(child, context);
      }
    }
  }

  /**
   * Применение темы к тексту
   */
  private applyTextTheme(textElement: TextElement, theme: any): void {
    // Применяем цветовую схему
    if (textElement.color && textElement.color.scheme) {
      const themeColor = theme.colors?.[textElement.color.scheme];
      if (themeColor) {
        textElement.color = this.mapColor(themeColor);
      }
    }

    // Применяем схему шрифтов
    if (textElement.fontFamily && theme.fonts) {
      const themeFont = theme.fonts[textElement.fontFamily];
      if (themeFont) {
        textElement.fontFamily = themeFont.name;
      }
    }
  }

  /**
   * Применение темы к фигуре
   */
  private applyShapeTheme(shapeElement: ShapeElement, theme: any): void {
    // Применяем цветовую схему к заливке
    if (shapeElement.fill && shapeElement.fill.color && shapeElement.fill.color.scheme) {
      const themeColor = theme.colors?.[shapeElement.fill.color.scheme];
      if (themeColor) {
        shapeElement.fill.color = this.mapColor(themeColor);
      }
    }

    // Применяем цветовую схему к обводке
    if (shapeElement.stroke && shapeElement.stroke.color && shapeElement.stroke.color.scheme) {
      const themeColor = theme.colors?.[shapeElement.stroke.color.scheme];
      if (themeColor) {
        shapeElement.stroke.color = this.mapColor(themeColor);
      }
    }
  }

  /**
   * Утилиты для конвертации
   */
  private convertEMUToPixels(emu: number): number {
    return (emu / 914400) * 96; // 1 inch = 914400 EMU, 1 inch = 96 pixels
  }

  private convertPointsToPixels(points: number): number {
    return points * 1.333333; // 1 point = 1.333333 pixels
  }

  private mapShapeType(type: string): string {
    const shapeMap: { [key: string]: string } = {
      'rect': 'RECTANGLE',
      'ellipse': 'ELLIPSE',
      'triangle': 'TRIANGLE',
      'line': 'LINE',
      'arrow': 'ARROW',
      'star': 'STAR'
    };
    return shapeMap[type] || 'RECTANGLE';
  }

  private mapFill(fillData: any): any {
    if (!fillData) return null;
    
    return {
      type: fillData.type || 'SOLID',
      color: this.mapColor(fillData.color),
      opacity: fillData.opacity || 1.0
    };
  }

  private mapStroke(strokeData: any): any {
    if (!strokeData) return null;
    
    return {
      type: strokeData.type || 'SOLID',
      color: this.mapColor(strokeData.color),
      width: this.convertEMUToPixels(strokeData.width || 0),
      opacity: strokeData.opacity || 1.0
    };
  }

  private mapColor(colorData: any): ColorInfo {
    if (!colorData) {
      return { type: 'RGB', value: '#000000' };
    }

    if (colorData.type === 'RGB') {
      return {
        type: 'RGB',
        value: colorData.value || '#000000'
      };
    }

    if (colorData.type === 'SCHEME') {
      return {
        type: 'SCHEME',
        scheme: colorData.scheme || 'dk1',
        tint: colorData.tint || 0,
        shade: colorData.shade || 0,
        alpha: colorData.alpha || 1.0
      };
    }

    return { type: 'RGB', value: '#000000' };
  }
}
