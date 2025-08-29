# Практическое руководство по реализации

## Обзор архитектурных решений

На основе анализа всех вопросов в `qa.md` приняты следующие ключевые решения:

### 🏗️ Архитектура сборки
- **UI**: Vite с hot reload для React компонентов
- **Main**: ESBuild для быстрой сборки code.ts
- **Конфигурация**: Общий tsconfig, два энтрипойнта

### 📦 Управление состоянием
- **UI**: Zustand для простого и эффективного управления состоянием
- **Формы**: react-hook-form поверх Zustand
- **Сообщения**: Типизированные discriminated union

### ⚡ Производительность
- **Парсинг**: Web Worker для тяжелых операций
- **Рендеринг**: Батчевое создание узлов Figma
- **Кэширование**: In-memory + LRU для изображений

## Детальные рекомендации по реализации

### 1. Настройка сборки

#### Vite конфигурация (UI)
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist/ui',
    rollupOptions: {
      input: 'src/ui/main.tsx',
      output: {
        entryFileNames: 'ui.js',
        format: 'iife'
      }
    }
  },
  server: {
    port: 5173,
    hmr: true
  }
})
```

#### ESBuild конфигурация (Main)
```typescript
// esbuild.config.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/main/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  format: 'iife',
  target: 'es2020',
  external: ['figma'],
  watch: process.argv.includes('--watch')
})
```

### 2. Система сообщений

#### Типизированные сообщения
```typescript
// src/shared/messages.ts
export type Message = 
  | { type: 'progress'; payload: { percent: number; stage: string } }
  | { type: 'slide'; payload: { slideIndex: number; totalSlides: number } }
  | { type: 'warn'; payload: { code: string; message: string; slide?: number } }
  | { type: 'error'; payload: { code: string; message: string; slide?: number } }
  | { type: 'complete'; payload: { slidesCreated: number; warnings: number } };

// Валидация через zod
export const messageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('progress'), payload: z.object({ percent: z.number(), stage: z.string() }) }),
  // ... остальные схемы
]);
```

### 3. Web Worker для парсинга

#### Worker структура
```typescript
// src/workers/parser.worker.ts
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

self.onmessage = async (e) => {
  const { pptxBuffer } = e.data;
  
  try {
    const zip = new JSZip();
    await zip.loadAsync(pptxBuffer);
    
    // Парсинг presentation.xml
    const presentationXml = await zip.file('ppt/presentation.xml')?.async('string');
    const parser = new XMLParser({ ignoreAttributes: false });
    const presentation = parser.parse(presentationXml);
    
    // Извлечение слайдов
    const slides = await extractSlides(zip, presentation);
    
    self.postMessage({ type: 'success', slides });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};
```

### 4. Кэширование и дедупликация

#### ImportContext
```typescript
// src/context/ImportContext.ts
export class ImportContext {
  private fontCache = new Map<string, FontName>();
  private imageCache = new Map<string, ImagePaint>();
  private themeCache = new Map<string, ThemeData>();
  private lruCache = new LRUCache<string, ImagePaint>(100);
  
  async getFont(family: string, style: string): Promise<FontName> {
    const key = `${family}-${style}`;
    if (this.fontCache.has(key)) {
      return this.fontCache.get(key)!;
    }
    
    // Попытка загрузки шрифта
    const font = await this.loadFont(family, style);
    this.fontCache.set(key, font);
    return font;
  }
  
  async getImage(hash: string, bytes: Uint8Array): Promise<ImagePaint> {
    if (this.imageCache.has(hash)) {
      return this.imageCache.get(hash)!;
    }
    
    const image = await figma.createImage(bytes);
    const imagePaint: ImagePaint = { type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' };
    
    this.imageCache.set(hash, imagePaint);
    this.lruCache.set(hash, imagePaint);
    return imagePaint;
  }
}
```

### 5. Обработка шрифтов

#### Таблица соответствий
```typescript
// config/font-mapping.json
{
  "Arial": "Inter",
  "Times New Roman": "Inter",
  "Calibri": "Inter",
  "Helvetica": "Inter",
  "Verdana": "Inter"
}

// src/utils/fonts.ts
export class FontManager {
  private mapping: Record<string, string>;
  
  constructor() {
    this.mapping = require('../../config/font-mapping.json');
  }
  
  async resolveFont(family: string, style: string): Promise<FontName> {
    // 1. Попытка загрузки оригинального шрифта
    try {
      await figma.loadFontAsync({ family, style });
      return { family, style };
    } catch {
      // 2. Поиск в таблице соответствий
      const mappedFamily = this.mapping[family] || 'Inter';
      try {
        await figma.loadFontAsync({ family: mappedFamily, style });
        return { family: mappedFamily, style };
      } catch {
        // 3. Fallback на Inter
        await figma.loadFontAsync({ family: 'Inter', style });
        return { family: 'Inter', style };
      }
    }
  }
}
```

### 6. Масштабирование

#### Утилиты масштабирования
```typescript
// src/utils/scaling.ts
export interface SlideDimensions {
  width: number;
  height: number;
}

export class ScalingManager {
  private static readonly TARGET_WIDTH = 1920;
  private static readonly TARGET_HEIGHT = 1080;
  
  static calculateScale(slideDimensions: SlideDimensions): number {
    const scaleX = this.TARGET_WIDTH / slideDimensions.width;
    const scaleY = this.TARGET_HEIGHT / slideDimensions.height;
    return Math.min(scaleX, scaleY);
  }
  
  static scaleValue(value: number, scale: number): number {
    return value * scale;
  }
  
  static centerElement(element: SceneNode, slideDimensions: SlideDimensions, scale: number): void {
    const scaledWidth = slideDimensions.width * scale;
    const scaledHeight = slideDimensions.height * scale;
    
    element.x = (this.TARGET_WIDTH - scaledWidth) / 2;
    element.y = (this.TARGET_HEIGHT - scaledHeight) / 2;
  }
}
```

### 7. Обработка неподдерживаемых элементов

#### Стратегия graceful degradation
```typescript
// src/renderer/unsupported-elements.ts
export class UnsupportedElementHandler {
  static async handleSmartArt(element: any, context: ImportContext): Promise<SceneNode> {
    // 1. Попытка векторизации
    const vector = await this.tryVectorize(element);
    if (vector) return vector;
    
    // 2. Попытка растеризации
    const raster = await this.tryRasterize(element);
    if (raster) return raster;
    
    // 3. Плейсхолдер
    return this.createPlaceholder(element, 'SmartArt');
  }
  
  private static async tryVectorize(element: any): Promise<SceneNode | null> {
    // Логика векторизации через DrawingML
    return null;
  }
  
  private static async tryRasterize(element: any): Promise<SceneNode | null> {
    // Логика растеризации из превью
    return null;
  }
  
  private static createPlaceholder(element: any, type: string): SceneNode {
    const rect = figma.createRectangle();
    rect.name = `[${type}] Placeholder`;
    rect.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    rect.resize(200, 100);
    
    const text = figma.createText();
    text.characters = `${type} (не поддерживается)`;
    text.fontSize = 12;
    text.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    
    const group = figma.group([rect, text], figma.currentPage);
    return group;
  }
}
```

### 8. Логирование и прогресс

#### Система логирования
```typescript
// src/utils/logging.ts
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  code: string;
  message: string;
  slide?: number;
  element?: string;
  timestamp: number;
}

export class Logger {
  private logs: LogEntry[] = [];
  
  info(code: string, message: string, slide?: number, element?: string): void {
    this.log(LogLevel.INFO, code, message, slide, element);
  }
  
  warn(code: string, message: string, slide?: number, element?: string): void {
    this.log(LogLevel.WARN, code, message, slide, element);
  }
  
  error(code: string, message: string, slide?: number, element?: string): void {
    this.log(LogLevel.ERROR, code, message, slide, element);
  }
  
  private log(level: LogLevel, code: string, message: string, slide?: number, element?: string): void {
    const entry: LogEntry = {
      level,
      code,
      message,
      slide,
      element,
      timestamp: Date.now()
    };
    
    this.logs.push(entry);
    
    // Отправка в UI
    figma.ui.postMessage({
      type: level === LogLevel.ERROR ? 'error' : 'warn',
      payload: { code, message, slide }
    });
  }
  
  getLogs(): LogEntry[] {
    return this.logs;
  }
}
```

### 9. Тестирование

#### Структура тестов
```typescript
// tests/unit/parser.test.ts
import { PPTXParser } from '../../src/parser/PPTXParser';

describe('PPTXParser', () => {
  it('should parse presentation.xml correctly', async () => {
    const parser = new PPTXParser();
    const result = await parser.parse(mockPPTXBuffer);
    
    expect(result.slides).toHaveLength(3);
    expect(result.theme).toBeDefined();
  });
});

// tests/integration/renderer.test.ts
import { FigmaRenderer } from '../../src/renderer/FigmaRenderer';

describe('FigmaRenderer', () => {
  it('should create text nodes with correct properties', async () => {
    const renderer = new FigmaRenderer();
    const textElement = mockTextElement;
    
    const node = await renderer.renderText(textElement);
    
    expect(node.type).toBe('TEXT');
    expect(node.fontSize).toBe(16);
    expect(node.fontName).toEqual({ family: 'Inter', style: 'Regular' });
  });
});
```

## Рекомендации по разработке

### 1. Приоритеты реализации
1. **Базовая инфраструктура** (сборка, сообщения, логирование)
2. **Парсер PPTX** (Web Worker + базовые типы)
3. **Рендеринг текста** (самый критичный элемент)
4. **Рендеринг фигур** (базовые геометрические формы)
5. **Обработка изображений** (с дедупликацией)
6. **Продвинутые функции** (мастер-слайды, списки)

### 2. Критерии качества
- **Производительность**: Импорт 100+ слайдов без заморозки UI
- **Точность**: Расхождение позиций ≤ 1px
- **Надежность**: Graceful degradation для всех неподдерживаемых элементов
- **Пользовательский опыт**: Понятные предупреждения и прогресс

### 3. Мониторинг и отладка
- Детальное логирование всех операций
- Профилирование производительности
- Валидация промежуточных результатов
- Сравнение с эталонными образцами

---

**Примечание**: Это руководство основано на принятых архитектурных решениях и должно обновляться по мере развития проекта.
