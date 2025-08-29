/**
 * @file: index.ts
 * @description: Главный файл экспорта доменных моделей
 * @dependencies: types.ts, factories.ts, utils.ts
 * @created: 2024-12-19
 */

// Экспорт всех типов
export * from './types';

// Экспорт фабрик
export { ModelFactories } from './factories';

// Экспорт утилит
export { ModelUtils } from './utils';

// Экспорт констант для удобства
export const EMU_CONSTANTS = {
  EMU_PER_INCH: 914400,
  EMU_PER_POINT: 12700,
  EMU_PER_PIXEL: 9525, // При 96 DPI
  DEFAULT_SLIDE_WIDTH: 9144000,
  DEFAULT_SLIDE_HEIGHT: 6858000
};

// Экспорт стандартных размеров слайдов
export const SLIDE_SIZES = {
  STANDARD_4_3: { width: 9144000, height: 6858000 }, // 4:3
  WIDE_16_9: { width: 9144000, height: 5143500 },    // 16:9
  WIDE_16_10: { width: 9144000, height: 5715000 },   // 16:10
  CUSTOM: { width: 9144000, height: 6858000 }        // По умолчанию
};

// Экспорт стандартных цветов
export const STANDARD_COLORS = {
  BLACK: { r: 0, g: 0, b: 0 },
  WHITE: { r: 1, g: 1, b: 1 },
  RED: { r: 1, g: 0, b: 0 },
  GREEN: { r: 0, g: 1, b: 0 },
  BLUE: { r: 0, g: 0, b: 1 },
  YELLOW: { r: 1, g: 1, b: 0 },
  CYAN: { r: 0, g: 1, b: 1 },
  MAGENTA: { r: 1, g: 0, b: 1 },
  GRAY: { r: 0.5, g: 0.5, b: 0.5 },
  LIGHT_GRAY: { r: 0.8, g: 0.8, b: 0.8 },
  DARK_GRAY: { r: 0.2, g: 0.2, b: 0.2 }
};

// Экспорт стандартных шрифтов
export const STANDARD_FONTS = {
  ARIAL: 'Arial',
  CALIBRI: 'Calibri',
  TIMES_NEW_ROMAN: 'Times New Roman',
  VERDANA: 'Verdana',
  GEORGIA: 'Georgia',
  TAHOMA: 'Tahoma',
  TREBUCHET_MS: 'Trebuchet MS',
  IMPACT: 'Impact',
  COMIC_SANS_MS: 'Comic Sans MS'
};

// Экспорт стандартных размеров шрифтов
export const STANDARD_FONT_SIZES = {
  TINY: 8,
  SMALL: 10,
  NORMAL: 12,
  MEDIUM: 14,
  LARGE: 16,
  EXTRA_LARGE: 18,
  HUGE: 24,
  TITLE: 32,
  HEADER: 48
};

// Экспорт стандартных стилей обводки
export const STANDARD_STROKE_STYLES = {
  NONE: { type: 'none' as const, width: 0 },
  THIN: { type: 'solid' as const, width: 1 },
  MEDIUM: { type: 'solid' as const, width: 2 },
  THICK: { type: 'solid' as const, width: 3 },
  DASHED: { type: 'dashed' as const, width: 1 },
  DOTTED: { type: 'dotted' as const, width: 1 }
};

// Экспорт стандартных стилей заливки
export const STANDARD_FILL_STYLES = {
  NONE: { type: 'none' as const },
  WHITE: { type: 'solid' as const, color: STANDARD_COLORS.WHITE },
  BLACK: { type: 'solid' as const, color: STANDARD_COLORS.BLACK },
  TRANSPARENT: { type: 'solid' as const, color: STANDARD_COLORS.WHITE, opacity: 0 }
};
