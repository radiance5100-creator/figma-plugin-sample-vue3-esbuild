/**
 * @file: ShapeMapper.ts
 * @description: Специализированный маппер для фигур и геометрических элементов PPTX
 * @dependencies: models/, ElementMapper
 * @created: 2024-12-19
 */

import { ShapeElement, ColorInfo } from '../models/types';
import { ModelFactories } from '../models/factories';
import { MappingContext } from './ElementMapper';
import { TextMapper } from './TextMapper';

export interface ShapeMappingOptions {
  preserveText: boolean;
  applyThemes: boolean;
  convertToVector: boolean;
}

export class ShapeMapper {
  /**
   * Маппинг фигуры из XML данных
   */
  static mapShapeElement(
    shapeData: any, 
    context: MappingContext,
    options: ShapeMappingOptions = {
      preserveText: true,
      applyThemes: true,
      convertToVector: false
    }
  ): ShapeElement | null {
    try {
      // Определяем тип фигуры
      const shapeType = this.determineShapeType(shapeData);
      
      // Создаем базовую фигуру
      const shape = ModelFactories.createShapeElement({
        id: shapeData.id || `shape_${Date.now()}`,
        type: shapeType,
        x: this.convertEMUToPixels(shapeData.x || 0) * context.scale,
        y: this.convertEMUToPixels(shapeData.y || 0) * context.scale,
        width: this.convertEMUToPixels(shapeData.width || 0) * context.scale,
        height: this.convertEMUToPixels(shapeData.height || 0) * context.scale,
        rotation: this.convertRotation(shapeData.rotation || 0),
        fill: this.mapFill(shapeData.fill),
        stroke: this.mapStroke(shapeData.stroke),
        opacity: shapeData.opacity || 1.0
      });

      // Добавляем специфичные свойства для типа фигуры
      this.applyShapeSpecificProperties(shape, shapeData, context);

      // Маппим текст внутри фигуры
      if (options.preserveText && shapeData.text) {
        const textElement = TextMapper.mapTextElement(shapeData.text, context);
        if (textElement) {
          shape.text = textElement;
        }
      }

      // Конвертируем в векторные пути если нужно
      if (options.convertToVector && this.shouldConvertToVector(shapeType)) {
        shape.vectorPaths = this.generateVectorPaths(shape, shapeData);
      }

      return shape;
    } catch (error) {
      console.warn('Ошибка маппинга фигуры:', error);
      return null;
    }
  }

  /**
   * Определение типа фигуры
   */
  private static determineShapeType(shapeData: any): string {
    const presetGeometry = shapeData.presetGeometry;
    
    if (!presetGeometry) {
      return 'RECTANGLE';
    }

    const shapeMap: { [key: string]: string } = {
      // Базовые фигуры
      'rect': 'RECTANGLE',
      'ellipse': 'ELLIPSE',
      'triangle': 'TRIANGLE',
      'diamond': 'DIAMOND',
      'parallelogram': 'PARALLELOGRAM',
      'trapezoid': 'TRAPEZOID',
      'hexagon': 'HEXAGON',
      'octagon': 'OCTAGON',
      
      // Стрелки
      'leftArrow': 'ARROW',
      'rightArrow': 'ARROW',
      'upArrow': 'ARROW',
      'downArrow': 'ARROW',
      'leftRightArrow': 'ARROW',
      'upDownArrow': 'ARROW',
      'quadArrow': 'ARROW',
      'leftRightUpArrow': 'ARROW',
      'bentArrow': 'ARROW',
      'uturnArrow': 'ARROW',
      'curvedRightArrow': 'ARROW',
      'curvedLeftArrow': 'ARROW',
      'curvedUpArrow': 'ARROW',
      'curvedDownArrow': 'ARROW',
      
      // Линии
      'line': 'LINE',
      'straightConnector1': 'LINE',
      'bentConnector2': 'LINE',
      'bentConnector3': 'LINE',
      'bentConnector4': 'LINE',
      'bentConnector5': 'LINE',
      'curvedConnector2': 'LINE',
      'curvedConnector3': 'LINE',
      'curvedConnector4': 'LINE',
      'curvedConnector5': 'LINE',
      
      // Звезды
      'star4': 'STAR',
      'star5': 'STAR',
      'star6': 'STAR',
      'star7': 'STAR',
      'star8': 'STAR',
      'star10': 'STAR',
      'star12': 'STAR',
      'star16': 'STAR',
      'star24': 'STAR',
      'star32': 'STAR',
      
      // Выноски
      'callout1': 'CALLOUT',
      'callout2': 'CALLOUT',
      'callout3': 'CALLOUT',
      'accentCallout1': 'CALLOUT',
      'accentCallout2': 'CALLOUT',
      'accentCallout3': 'CALLOUT',
      'borderCallout1': 'CALLOUT',
      'borderCallout2': 'CALLOUT',
      'borderCallout3': 'CALLOUT',
      
      // Блок-схемы
      'flowchartProcess': 'RECTANGLE',
      'flowchartDecision': 'DIAMOND',
      'flowchartData': 'RECTANGLE',
      'flowchartTerminator': 'RECTANGLE',
      'flowchartDocument': 'RECTANGLE',
      'flowchartPredefinedProcess': 'RECTANGLE',
      'flowchartStoredData': 'RECTANGLE',
      'flowchartInternalStorage': 'RECTANGLE',
      'flowchartSequentialAccessStorage': 'RECTANGLE',
      'flowchartMagneticDisk': 'ELLIPSE',
      'flowchartDirectAccessStorage': 'RECTANGLE',
      'flowchartDisplay': 'RECTANGLE',
      
      // Блоки
      'cube': 'CUBE',
      'can': 'CYLINDER',
      'pyramid': 'PYRAMID',
      'wedge': 'WEDGE',
      'bevel': 'BEVEL',
      'donut': 'DONUT',
      'noSmoking': 'RECTANGLE',
      'foldedCorner': 'RECTANGLE',
      'smileyFace': 'ELLIPSE',
      'moon': 'ELLIPSE',
      'heart': 'HEART',
      'lightningBolt': 'LIGHTNING',
      'sun': 'SUN',
      'flower': 'FLOWER',
      'cloud': 'CLOUD',
      'arc': 'ARC',
      'chord': 'CHORD',
      'pie': 'PIE'
    };

    return shapeMap[presetGeometry] || 'RECTANGLE';
  }

  /**
   * Применение специфичных свойств для типа фигуры
   */
  private static applyShapeSpecificProperties(
    shape: ShapeElement, 
    shapeData: any, 
    context: MappingContext
  ): void {
    switch (shape.type) {
      case 'ELLIPSE':
        this.applyEllipseProperties(shape, shapeData);
        break;
      case 'TRIANGLE':
        this.applyTriangleProperties(shape, shapeData);
        break;
      case 'ARROW':
        this.applyArrowProperties(shape, shapeData);
        break;
      case 'STAR':
        this.applyStarProperties(shape, shapeData);
        break;
      case 'LINE':
        this.applyLineProperties(shape, shapeData);
        break;
      case 'CALLOUT':
        this.applyCalloutProperties(shape, shapeData);
        break;
    }
  }

  /**
   * Свойства для эллипса
   */
  private static applyEllipseProperties(shape: ShapeElement, shapeData: any): void {
    // Эллипс может иметь различные соотношения сторон
    if (shapeData.adjustValues) {
      shape.adjustValues = shapeData.adjustValues;
    }
  }

  /**
   * Свойства для треугольника
   */
  private static applyTriangleProperties(shape: ShapeElement, shapeData: any): void {
    // Треугольник может быть направлен в разные стороны
    if (shapeData.flipH) {
      shape.flipH = shapeData.flipH;
    }
    if (shapeData.flipV) {
      shape.flipV = shapeData.flipV;
    }
  }

  /**
   * Свойства для стрелок
   */
  private static applyArrowProperties(shape: ShapeElement, shapeData: any): void {
    shape.arrowHead = shapeData.arrowHead || 'triangle';
    shape.arrowTail = shapeData.arrowTail || 'none';
    shape.arrowWidth = shapeData.arrowWidth || 'medium';
    shape.arrowLength = shapeData.arrowLength || 'medium';
  }

  /**
   * Свойства для звезд
   */
  private static applyStarProperties(shape: ShapeElement, shapeData: any): void {
    // Количество лучей звезды
    if (shapeData.points) {
      shape.points = shapeData.points;
    }
    // Внутренний радиус
    if (shapeData.innerRadius) {
      shape.innerRadius = this.convertEMUToPixels(shapeData.innerRadius);
    }
  }

  /**
   * Свойства для линий
   */
  private static applyLineProperties(shape: ShapeElement, shapeData: any): void {
    shape.lineStyle = shapeData.lineStyle || 'solid';
    shape.lineWidth = this.convertEMUToPixels(shapeData.lineWidth || 0);
    shape.capType = shapeData.capType || 'flat';
    shape.joinType = shapeData.joinType || 'miter';
  }

  /**
   * Свойства для выносок
   */
  private static applyCalloutProperties(shape: ShapeElement, shapeData: any): void {
    if (shapeData.calloutPoints) {
      shape.calloutPoints = shapeData.calloutPoints.map((point: any) => ({
        x: this.convertEMUToPixels(point.x),
        y: this.convertEMUToPixels(point.y)
      }));
    }
  }

  /**
   * Маппинг заливки
   */
  private static mapFill(fillData: any): any {
    if (!fillData) return null;

    const fill = {
      type: fillData.type || 'SOLID',
      opacity: fillData.opacity || 1.0
    };

    switch (fillData.type) {
      case 'SOLID':
        fill.color = this.mapColor(fillData.color);
        break;
      case 'GRADIENT':
        fill.gradient = {
          type: fillData.gradientType || 'LINEAR',
          stops: fillData.stops?.map((stop: any) => ({
            position: stop.position || 0,
            color: this.mapColor(stop.color)
          })) || [],
          angle: fillData.angle || 0
        };
        break;
      case 'PATTERN':
        fill.pattern = {
          type: fillData.patternType || 'SOLID',
          foregroundColor: this.mapColor(fillData.foregroundColor),
          backgroundColor: this.mapColor(fillData.backgroundColor)
        };
        break;
      case 'PICTURE':
        fill.picture = {
          src: fillData.src,
          crop: fillData.crop || { left: 0, top: 0, right: 0, bottom: 0 }
        };
        break;
    }

    return fill;
  }

  /**
   * Маппинг обводки
   */
  private static mapStroke(strokeData: any): any {
    if (!strokeData) return null;

    return {
      type: strokeData.type || 'SOLID',
      color: this.mapColor(strokeData.color),
      width: this.convertEMUToPixels(strokeData.width || 0),
      opacity: strokeData.opacity || 1.0,
      style: strokeData.style || 'SOLID',
      capType: strokeData.capType || 'FLAT',
      joinType: strokeData.joinType || 'MITER',
      dashType: strokeData.dashType || 'SOLID'
    };
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
   * Определение необходимости конвертации в вектор
   */
  private static shouldConvertToVector(shapeType: string): boolean {
    const vectorShapes = ['ARROW', 'STAR', 'CALLOUT', 'HEART', 'LIGHTNING', 'SUN', 'FLOWER', 'CLOUD'];
    return vectorShapes.includes(shapeType);
  }

  /**
   * Генерация векторных путей
   */
  private static generateVectorPaths(shape: ShapeElement, shapeData: any): any[] {
    // Базовая реализация - можно расширить для конкретных типов фигур
    switch (shape.type) {
      case 'ARROW':
        return this.generateArrowPaths(shape);
      case 'STAR':
        return this.generateStarPaths(shape);
      case 'HEART':
        return this.generateHeartPaths(shape);
      default:
        return [];
    }
  }

  /**
   * Генерация путей для стрелки
   */
  private static generateArrowPaths(shape: ShapeElement): any[] {
    const { width, height } = shape;
    const arrowHeadSize = Math.min(width, height) * 0.3;
    
    return [{
      type: 'PATH',
      data: `M 0 ${height/2} L ${width-arrowHeadSize} ${height/2} L ${width-arrowHeadSize} 0 L ${width} ${height/2} L ${width-arrowHeadSize} ${height} L ${width-arrowHeadSize} ${height/2} Z`
    }];
  }

  /**
   * Генерация путей для звезды
   */
  private static generateStarPaths(shape: ShapeElement): any[] {
    const { width, height } = shape;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.4;
    const points = shape.points || 5;
    
    const path = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + radius * Math.cos(angle - Math.PI / 2);
      const y = centerY + radius * Math.sin(angle - Math.PI / 2);
      
      if (i === 0) {
        path.push(`M ${x} ${y}`);
      } else {
        path.push(`L ${x} ${y}`);
      }
    }
    path.push('Z');
    
    return [{
      type: 'PATH',
      data: path.join(' ')
    }];
  }

  /**
   * Генерация путей для сердца
   */
  private static generateHeartPaths(shape: ShapeElement): any[] {
    const { width, height } = shape;
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) / 2;
    
    return [{
      type: 'PATH',
      data: `M ${centerX} ${centerY + size * 0.3} C ${centerX - size * 0.5} ${centerY - size * 0.1} ${centerX - size * 0.5} ${centerY - size * 0.5} ${centerX} ${centerY - size * 0.5} C ${centerX + size * 0.5} ${centerY - size * 0.5} ${centerX + size * 0.5} ${centerY - size * 0.1} ${centerX} ${centerY + size * 0.3} Z`
    }];
  }
}
