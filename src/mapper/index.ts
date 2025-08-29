/**
 * @file: index.ts
 * @description: Главный экспорт для системы маппинга элементов PPTX
 * @dependencies: ElementMapper, TextMapper, ShapeMapper, ImageMapper
 * @created: 2024-12-19
 */

export { ElementMapper, MappingContext, MappingResult } from './ElementMapper';
export { TextMapper, TextMappingOptions } from './TextMapper';
export { ShapeMapper, ShapeMappingOptions } from './ShapeMapper';
export { ImageMapper, ImageMappingOptions } from './ImageMapper';

// Реэкспорт типов для удобства
export type {
  TextElement,
  ShapeElement,
  ImageElement,
  GroupElement,
  LineElement,
  SlideElement,
  ColorInfo,
  FontInfo
} from '../models/types';

// Реэкспорт фабрик
export { ModelFactories } from '../models/factories';
export { ModelUtils } from '../models/utils';
