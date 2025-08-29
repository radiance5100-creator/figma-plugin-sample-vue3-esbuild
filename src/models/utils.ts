/**
 * @file: utils.ts
 * @description: Утилиты для работы с доменными моделями
 * @dependencies: types.ts
 * @created: 2024-12-19
 */

import {
  Point,
  Size,
  Color,
  RGBColor,
  Element,
  TextElement,
  ShapeElement,
  ImageElement,
  GroupElement,
  LineElement,
  Slide,
  Presentation
} from './types';

// Утилиты для работы с доменными моделями
export class ModelUtils {

  // Конвертация единиц измерения
  static readonly EMU_PER_INCH = 914400;
  static readonly EMU_PER_POINT = 12700;
  static readonly EMU_PER_PIXEL = 9525; // При 96 DPI

  // Конвертация EMU в пиксели
  static emuToPixels(emu: number): number {
    return emu / this.EMU_PER_PIXEL;
  }

  // Конвертация пикселей в EMU
  static pixelsToEmu(pixels: number): number {
    return pixels * this.EMU_PER_PIXEL;
  }

  // Конвертация EMU в точки
  static emuToPoints(emu: number): number {
    return emu / this.EMU_PER_POINT;
  }

  // Конвертация точек в EMU
  static pointsToEmu(points: number): number {
    return points * this.EMU_PER_POINT;
  }

  // Конвертация EMU в дюймы
  static emuToInches(emu: number): number {
    return emu / this.EMU_PER_INCH;
  }

  // Конвертация дюймов в EMU
  static inchesToEmu(inches: number): number {
    return inches * this.EMU_PER_INCH;
  }

  // Конвертация цвета из hex в RGB
  static hexToRGB(hex: string): RGBColor {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    return { r, g, b };
  }

  // Конвертация RGB в hex
  static rgbToHex(color: RGBColor): string {
    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Проверка, является ли элемент текстовым
  static isTextElement(element: Element): element is TextElement {
    return element.type === 'text';
  }

  // Проверка, является ли элемент фигурой
  static isShapeElement(element: Element): element is ShapeElement {
    return element.type === 'shape';
  }

  // Проверка, является ли элемент изображением
  static isImageElement(element: Element): element is ImageElement {
    return element.type === 'image';
  }

  // Проверка, является ли элемент группой
  static isGroupElement(element: Element): element is GroupElement {
    return element.type === 'group';
  }

  // Проверка, является ли элемент линией
  static isLineElement(element: Element): element is LineElement {
    return element.type === 'line';
  }

  // Получение всех элементов из слайда (включая вложенные)
  static getAllElements(slide: Slide): Element[] {
    const elements: Element[] = [];
    
    for (const element of slide.elements) {
      elements.push(element);
      
      if (this.isGroupElement(element)) {
        elements.push(...this.getAllElementsFromGroup(element));
      }
    }
    
    return elements;
  }

  // Получение всех элементов из группы
  static getAllElementsFromGroup(group: GroupElement): Element[] {
    const elements: Element[] = [];
    
    for (const child of group.children) {
      elements.push(child);
      
      if (this.isGroupElement(child)) {
        elements.push(...this.getAllElementsFromGroup(child));
      }
    }
    
    return elements;
  }

  // Поиск элемента по ID
  static findElementById(slide: Slide, id: string): Element | null {
    const allElements = this.getAllElements(slide);
    return allElements.find(element => element.id === id) || null;
  }

  // Поиск элементов по типу
  static findElementsByType(slide: Slide, type: string): Element[] {
    const allElements = this.getAllElements(slide);
    return allElements.filter(element => element.type === type);
  }

  // Получение текстовых элементов
  static getTextElements(slide: Slide): TextElement[] {
    return this.findElementsByType(slide, 'text') as TextElement[];
  }

  // Получение фигур
  static getShapeElements(slide: Slide): ShapeElement[] {
    return this.findElementsByType(slide, 'shape') as ShapeElement[];
  }

  // Получение изображений
  static getImageElements(slide: Slide): ImageElement[] {
    return this.findElementsByType(slide, 'image') as ImageElement[];
  }

  // Получение групп
  static getGroupElements(slide: Slide): GroupElement[] {
    return this.findElementsByType(slide, 'group') as GroupElement[];
  }

  // Получение линий
  static getLineElements(slide: Slide): LineElement[] {
    return this.findElementsByType(slide, 'line') as LineElement[];
  }

  // Вычисление границ элемента
  static getElementBounds(element: Element): { x: number; y: number; width: number; height: number } {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height
    };
  }

  // Проверка пересечения двух элементов
  static elementsIntersect(element1: Element, element2: Element): boolean {
    const bounds1 = this.getElementBounds(element1);
    const bounds2 = this.getElementBounds(element2);
    
    return !(
      bounds1.x + bounds1.width <= bounds2.x ||
      bounds2.x + bounds2.width <= bounds1.x ||
      bounds1.y + bounds1.height <= bounds2.y ||
      bounds2.y + bounds2.height <= bounds1.y
    );
  }

  // Вычисление центра элемента
  static getElementCenter(element: Element): Point {
    return {
      x: element.position.x + element.size.width / 2,
      y: element.position.y + element.size.height / 2
    };
  }

  // Вычисление расстояния между двумя точками
  static getDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Проверка, находится ли точка внутри элемента
  static isPointInElement(point: Point, element: Element): boolean {
    const bounds = this.getElementBounds(element);
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  // Получение размера слайда в пикселях
  static getSlideSizeInPixels(slide: Slide): Size {
    return {
      width: this.emuToPixels(slide.size.width),
      height: this.emuToPixels(slide.size.height)
    };
  }

  // Получение позиции элемента в пикселях
  static getElementPositionInPixels(element: Element): Point {
    return {
      x: this.emuToPixels(element.position.x),
      y: this.emuToPixels(element.position.y)
    };
  }

  // Получение размера элемента в пикселях
  static getElementSizeInPixels(element: Element): Size {
    return {
      width: this.emuToPixels(element.size.width),
      height: this.emuToPixels(element.size.height)
    };
  }

  // Создание копии элемента с новыми координатами
  static cloneElementWithPosition(element: Element, position: Point): Element {
    return {
      ...element,
      id: `${element.id}-copy-${Date.now()}`,
      position
    };
  }

  // Создание копии элемента с новым размером
  static cloneElementWithSize(element: Element, size: Size): Element {
    return {
      ...element,
      id: `${element.id}-copy-${Date.now()}`,
      size
    };
  }

  // Получение статистики по слайду
  static getSlideStatistics(slide: Slide): {
    totalElements: number;
    textElements: number;
    shapeElements: number;
    imageElements: number;
    groupElements: number;
    lineElements: number;
  } {
    const allElements = this.getAllElements(slide);
    
    return {
      totalElements: allElements.length,
      textElements: allElements.filter(e => this.isTextElement(e)).length,
      shapeElements: allElements.filter(e => this.isShapeElement(e)).length,
      imageElements: allElements.filter(e => this.isImageElement(e)).length,
      groupElements: allElements.filter(e => this.isGroupElement(e)).length,
      lineElements: allElements.filter(e => this.isLineElement(e)).length
    };
  }

  // Получение статистики по презентации
  static getPresentationStatistics(presentation: Presentation): {
    totalSlides: number;
    totalElements: number;
    totalTextElements: number;
    totalShapeElements: number;
    totalImageElements: number;
    totalGroupElements: number;
    totalLineElements: number;
  } {
    let totalElements = 0;
    let totalTextElements = 0;
    let totalShapeElements = 0;
    let totalImageElements = 0;
    let totalGroupElements = 0;
    let totalLineElements = 0;

    for (const slide of presentation.slides) {
      const stats = this.getSlideStatistics(slide);
      totalElements += stats.totalElements;
      totalTextElements += stats.textElements;
      totalShapeElements += stats.shapeElements;
      totalImageElements += stats.imageElements;
      totalGroupElements += stats.groupElements;
      totalLineElements += stats.lineElements;
    }

    return {
      totalSlides: presentation.slides.length,
      totalElements,
      totalTextElements,
      totalShapeElements,
      totalImageElements,
      totalGroupElements,
      totalLineElements
    };
  }

  // Валидация элемента
  static validateElement(element: Element): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Проверка обязательных полей
    if (!element.id) {
      errors.push('Element must have an ID');
    }

    if (!element.type) {
      errors.push('Element must have a type');
    }

    if (element.position.x < 0 || element.position.y < 0) {
      errors.push('Element position cannot be negative');
    }

    if (element.size.width <= 0 || element.size.height <= 0) {
      errors.push('Element size must be positive');
    }

    if (element.opacity < 0 || element.opacity > 1) {
      errors.push('Element opacity must be between 0 and 1');
    }

    // Проверка специфичных для типа полей
    if (this.isTextElement(element)) {
      if (!element.paragraphs || element.paragraphs.length === 0) {
        errors.push('Text element must have at least one paragraph');
      }
    }

    if (this.isImageElement(element)) {
      if (!element.src) {
        errors.push('Image element must have a source');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Валидация слайда
  static validateSlide(slide: Slide): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!slide.id) {
      errors.push('Slide must have an ID');
    }

    if (!slide.name) {
      errors.push('Slide must have a name');
    }

    if (slide.number <= 0) {
      errors.push('Slide number must be positive');
    }

    if (slide.size.width <= 0 || slide.size.height <= 0) {
      errors.push('Slide size must be positive');
    }

    // Валидация всех элементов слайда
    for (const element of slide.elements) {
      const elementValidation = this.validateElement(element);
      if (!elementValidation.isValid) {
        errors.push(`Element ${element.id}: ${elementValidation.errors.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
