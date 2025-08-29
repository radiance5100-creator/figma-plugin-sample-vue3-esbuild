/**
 * @file: ImageMapper.ts
 * @description: Специализированный маппер для изображений PPTX
 * @dependencies: models/, ElementMapper
 * @created: 2024-12-19
 */

import { ImageElement, ColorInfo } from '../models/types';
import { ModelFactories } from '../models/factories';
import { MappingContext } from './ElementMapper';

export interface ImageMappingOptions {
  preserveAspectRatio: boolean;
  applyCrop: boolean;
  applyRotation: boolean;
  deduplicate: boolean;
}

export class ImageMapper {
  private static imageCache = new Map<string, string>(); // хэш -> base64

  /**
   * Маппинг изображения из XML данных
   */
  static async mapImageElement(
    imageData: any, 
    context: MappingContext,
    options: ImageMappingOptions = {
      preserveAspectRatio: true,
      applyCrop: true,
      applyRotation: true,
      deduplicate: true
    }
  ): Promise<ImageElement | null> {
    try {
      // Извлекаем данные изображения
      const imageBytes = await this.extractImageBytes(imageData);
      if (!imageBytes) {
        console.warn('Не удалось извлечь данные изображения');
        return null;
      }

      // Проверяем дедупликацию
      const imageHash = await this.generateImageHash(imageBytes);
      let imageSrc = imageBytes;

      if (options.deduplicate && this.imageCache.has(imageHash)) {
        imageSrc = this.imageCache.get(imageHash)!;
      } else if (options.deduplicate) {
        this.imageCache.set(imageHash, imageBytes);
      }

      // Создаем элемент изображения
      const image = ModelFactories.createImageElement({
        id: imageData.id || `image_${Date.now()}`,
        x: this.convertEMUToPixels(imageData.x || 0) * context.scale,
        y: this.convertEMUToPixels(imageData.y || 0) * context.scale,
        width: this.convertEMUToPixels(imageData.width || 0) * context.scale,
        height: this.convertEMUToPixels(imageData.height || 0) * context.scale,
        rotation: this.convertRotation(imageData.rotation || 0),
        src: imageSrc,
        alt: imageData.alt || '',
        opacity: imageData.opacity || 1.0
      });

      // Применяем обрезку
      if (options.applyCrop && imageData.crop) {
        this.applyCrop(image, imageData.crop);
      }

      // Применяем поворот
      if (options.applyRotation && imageData.rotation) {
        this.applyRotation(image, imageData.rotation);
      }

      // Сохраняем пропорции
      if (options.preserveAspectRatio) {
        this.preserveAspectRatio(image, imageData);
      }

      // Добавляем метаданные
      this.addImageMetadata(image, imageData);

      return image;
    } catch (error) {
      console.warn('Ошибка маппинга изображения:', error);
      return null;
    }
  }

  /**
   * Извлечение байтов изображения
   */
  private static async extractImageBytes(imageData: any): Promise<string | null> {
    try {
      // Поддерживаемые форматы изображений
      const supportedFormats = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
      
      if (imageData.src) {
        const format = this.getImageFormat(imageData.src);
        if (supportedFormats.includes(format)) {
          return imageData.src;
        }
      }

      if (imageData.bytes) {
        // Конвертируем байты в base64
        return this.bytesToBase64(imageData.bytes);
      }

      if (imageData.relationshipId) {
        // Извлекаем из relationships
        return await this.extractFromRelationship(imageData.relationshipId);
      }

      return null;
    } catch (error) {
      console.warn('Ошибка извлечения данных изображения:', error);
      return null;
    }
  }

  /**
   * Генерация хэша изображения для дедупликации
   */
  private static async generateImageHash(imageBytes: string): Promise<string> {
    try {
      // Простая хэш-функция для дедупликации
      let hash = 0;
      const str = imageBytes.substring(0, 1000); // Берем первые 1000 символов для скорости
      
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Конвертируем в 32-битное целое
      }
      
      return hash.toString(36);
    } catch (error) {
      console.warn('Ошибка генерации хэша изображения:', error);
      return Date.now().toString();
    }
  }

  /**
   * Применение обрезки изображения
   */
  private static applyCrop(image: ImageElement, cropData: any): void {
    if (!cropData) return;

    const crop = {
      left: cropData.left || 0,
      top: cropData.top || 0,
      right: cropData.right || 0,
      bottom: cropData.bottom || 0
    };

    // Конвертируем проценты в пиксели если нужно
    if (crop.left <= 1) crop.left *= image.width;
    if (crop.top <= 1) crop.top *= image.height;
    if (crop.right <= 1) crop.right *= image.width;
    if (crop.bottom <= 1) crop.bottom *= image.height;

    image.crop = crop;

    // Корректируем размеры изображения
    const cropWidth = image.width - crop.left - crop.right;
    const cropHeight = image.height - crop.top - crop.bottom;
    
    if (cropWidth > 0 && cropHeight > 0) {
      image.width = cropWidth;
      image.height = cropHeight;
    }
  }

  /**
   * Применение поворота изображения
   */
  private static applyRotation(image: ImageElement, rotation: number): void {
    image.rotation = this.convertRotation(rotation);
  }

  /**
   * Сохранение пропорций изображения
   */
  private static preserveAspectRatio(image: ImageElement, imageData: any): void {
    if (!imageData.originalWidth || !imageData.originalHeight) return;

    const originalAspectRatio = imageData.originalWidth / imageData.originalHeight;
    const currentAspectRatio = image.width / image.height;

    if (Math.abs(originalAspectRatio - currentAspectRatio) > 0.01) {
      // Корректируем размеры для сохранения пропорций
      if (currentAspectRatio > originalAspectRatio) {
        // Слишком широкое - уменьшаем ширину
        image.width = image.height * originalAspectRatio;
      } else {
        // Слишком высокое - уменьшаем высоту
        image.height = image.width / originalAspectRatio;
      }
    }
  }

  /**
   * Добавление метаданных изображения
   */
  private static addImageMetadata(image: ImageElement, imageData: any): void {
    image.metadata = {
      format: this.getImageFormat(image.src),
      originalWidth: imageData.originalWidth,
      originalHeight: imageData.originalHeight,
      dpi: imageData.dpi || 96,
      compression: imageData.compression || 'none',
      colorSpace: imageData.colorSpace || 'RGB',
      hasTransparency: imageData.hasTransparency || false
    };
  }

  /**
   * Определение формата изображения
   */
  private static getImageFormat(src: string): string {
    if (src.startsWith('data:image/')) {
      const match = src.match(/data:image\/([^;]+)/);
      return match ? match[1] : 'unknown';
    }

    const extension = src.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  /**
   * Конвертация байтов в base64
   */
  private static bytesToBase64(bytes: Uint8Array): string {
    try {
      const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
      return btoa(binary);
    } catch (error) {
      console.warn('Ошибка конвертации байтов в base64:', error);
      return '';
    }
  }

  /**
   * Извлечение изображения из relationships
   */
  private static async extractFromRelationship(relationshipId: string): Promise<string | null> {
    try {
      // Здесь должна быть логика извлечения из relationships
      // Пока возвращаем null
      console.warn('Извлечение из relationships не реализовано');
      return null;
    } catch (error) {
      console.warn('Ошибка извлечения из relationships:', error);
      return null;
    }
  }

  /**
   * Конвертация поворота
   */
  private static convertRotation(rotation: number): number {
    // PPTX использует 60000 единиц на градус
    return rotation / 60000;
  }

  /**
   * Конвертация EMU в пиксели
   */
  private static convertEMUToPixels(emu: number): number {
    return (emu / 914400) * 96; // 1 inch = 914400 EMU, 1 inch = 96 pixels
  }

  /**
   * Очистка кэша изображений
   */
  static clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * Получение статистики кэша
   */
  static getCacheStats(): { size: number; entries: number } {
    return {
      size: this.imageCache.size,
      entries: this.imageCache.size
    };
  }
}
