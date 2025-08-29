/**
 * @file: TextMapper.ts
 * @description: Специализированный маппер для текстовых элементов PPTX
 * @dependencies: models/, ElementMapper
 * @created: 2024-12-19
 */

import { TextElement, ColorInfo, FontInfo } from '../models/types';
import { ModelFactories } from '../models/factories';
import { MappingContext } from './ElementMapper';

export interface TextMappingOptions {
  preserveFormatting: boolean;
  autoFit: boolean;
  wordWrap: boolean;
  verticalAlignment: 'top' | 'middle' | 'bottom';
}

export class TextMapper {
  /**
   * Маппинг текстового элемента из XML данных
   */
  static mapTextElement(
    textData: any, 
    context: MappingContext,
    options: TextMappingOptions = {
      preserveFormatting: true,
      autoFit: true,
      wordWrap: true,
      verticalAlignment: 'top'
    }
  ): TextElement | null {
    try {
      // Создаем базовый текстовый элемент
      const textElement = ModelFactories.createTextElement({
        id: textData.id || `text_${Date.now()}`,
        x: this.convertEMUToPixels(textData.x || 0) * context.scale,
        y: this.convertEMUToPixels(textData.y || 0) * context.scale,
        width: this.convertEMUToPixels(textData.width || 0) * context.scale,
        height: this.convertEMUToPixels(textData.height || 0) * context.scale,
        content: this.extractTextContent(textData),
        fontSize: this.convertPointsToPixels(textData.fontSize || 12) * context.scale,
        fontFamily: textData.fontFamily || 'Arial',
        fontWeight: textData.fontWeight || 'normal',
        fontStyle: textData.fontStyle || 'normal',
        color: this.mapColor(textData.color),
        alignment: this.mapAlignment(textData.alignment),
        opacity: textData.opacity || 1.0
      });

      // Применяем опции форматирования
      if (options.preserveFormatting) {
        textElement.paragraphs = this.mapParagraphs(textData.paragraphs || [], context);
      }

      // Применяем авто-подгонку
      if (options.autoFit) {
        this.applyAutoFit(textElement, context);
      }

      // Применяем перенос слов
      if (options.wordWrap) {
        textElement.wordWrap = true;
      }

      // Применяем вертикальное выравнивание
      textElement.verticalAlignment = options.verticalAlignment;

      return textElement;
    } catch (error) {
      console.warn('Ошибка маппинга текстового элемента:', error);
      return null;
    }
  }

  /**
   * Маппинг параграфов
   */
  static mapParagraphs(paragraphsData: any[], context: MappingContext): any[] {
    return paragraphsData.map(paragraph => ({
      alignment: this.mapAlignment(paragraph.alignment),
      indent: this.convertEMUToPixels(paragraph.indent || 0) * context.scale,
      lineHeight: paragraph.lineHeight || 1.2,
      spaceBefore: this.convertEMUToPixels(paragraph.spaceBefore || 0) * context.scale,
      spaceAfter: this.convertEMUToPixels(paragraph.spaceAfter || 0) * context.scale,
      runs: this.mapTextRuns(paragraph.runs || [], context),
      bullet: this.mapBullet(paragraph.bullet)
    }));
  }

  /**
   * Маппинг текстовых runs
   */
  static mapTextRuns(runsData: any[], context: MappingContext): any[] {
    return runsData.map(run => ({
      text: run.text || '',
      fontSize: this.convertPointsToPixels(run.fontSize || 12) * context.scale,
      fontFamily: run.fontFamily || 'Arial',
      fontWeight: run.fontWeight || 'normal',
      fontStyle: run.fontStyle || 'normal',
      color: this.mapColor(run.color),
      bold: run.bold || false,
      italic: run.italic || false,
      underline: run.underline || false,
      strikethrough: run.strikethrough || false,
      hyperlink: run.hyperlink ? {
        url: run.hyperlink.url,
        tooltip: run.hyperlink.tooltip || ''
      } : null
    }));
  }

  /**
   * Маппинг маркированных списков
   */
  static mapBullet(bulletData: any): any {
    if (!bulletData) return null;

    return {
      type: bulletData.type || 'bullet', // 'bullet' | 'number' | 'picture'
      level: bulletData.level || 0,
      character: bulletData.character || '•',
      size: this.convertPointsToPixels(bulletData.size || 12),
      color: this.mapColor(bulletData.color),
      font: bulletData.font || 'Arial'
    };
  }

  /**
   * Извлечение текстового содержимого
   */
  private static extractTextContent(textData: any): string {
    if (textData.content) {
      return textData.content;
    }

    if (textData.paragraphs) {
      return textData.paragraphs
        .map((paragraph: any) => 
          paragraph.runs?.map((run: any) => run.text || '').join('') || ''
        )
        .join('\n');
    }

    return '';
  }

  /**
   * Применение авто-подгонки текста
   */
  private static applyAutoFit(textElement: TextElement, context: MappingContext): void {
    const content = textElement.content;
    const maxWidth = textElement.width;
    const maxHeight = textElement.height;

    if (!content || !maxWidth || !maxHeight) return;

    // Простая авто-подгонка - уменьшаем размер шрифта
    let fontSize = textElement.fontSize;
    const minFontSize = 8 * context.scale;

    while (fontSize > minFontSize) {
      // Проверяем, помещается ли текст
      const estimatedHeight = this.estimateTextHeight(content, fontSize, maxWidth);
      
      if (estimatedHeight <= maxHeight) {
        break;
      }

      fontSize -= 1 * context.scale;
    }

    textElement.fontSize = Math.max(fontSize, minFontSize);
  }

  /**
   * Оценка высоты текста
   */
  private static estimateTextHeight(
    text: string, 
    fontSize: number, 
    maxWidth: number
  ): number {
    // Простая оценка - можно улучшить с помощью canvas или более точных расчетов
    const lineHeight = fontSize * 1.2;
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6)); // примерная ширина символа
    const lines = Math.ceil(text.length / charsPerLine);
    return lines * lineHeight;
  }

  /**
   * Маппинг выравнивания текста
   */
  private static mapAlignment(alignment: string): string {
    const alignmentMap: { [key: string]: string } = {
      'l': 'left',
      'ctr': 'center',
      'r': 'right',
      'just': 'justify',
      'dist': 'justify',
      'thaiDist': 'justify'
    };
    return alignmentMap[alignment] || 'left';
  }

  /**
   * Маппинг цвета
   */
  private static mapColor(colorData: any): ColorInfo {
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

  /**
   * Конвертация EMU в пиксели
   */
  private static convertEMUToPixels(emu: number): number {
    return (emu / 914400) * 96; // 1 inch = 914400 EMU, 1 inch = 96 pixels
  }

  /**
   * Конвертация точек в пиксели
   */
  private static convertPointsToPixels(points: number): number {
    return points * 1.333333; // 1 point = 1.333333 pixels
  }
}
