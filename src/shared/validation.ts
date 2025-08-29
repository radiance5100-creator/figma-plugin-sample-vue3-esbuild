/**
 * @file: validation.ts
 * @description: Функции валидации для файлов и сообщений
 * @dependencies: types.ts
 * @created: 2024-12-19
 */

import { FileValidation, ImportSettings, UIMessage, MainMessage } from './types'

// Валидация PPTX файла
export function validatePPTXFile(file: File): FileValidation {
  const validation: FileValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type
  }

  // Проверка расширения файла
  if (!file.name.toLowerCase().endsWith('.pptx')) {
    validation.isValid = false
    validation.errors.push('Файл должен иметь расширение .pptx')
  }

  // Проверка типа MIME
  if (file.type && file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    validation.warnings.push('Неожиданный тип файла, но попробуем обработать')
  }

  // Проверка размера файла (максимум 100MB)
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    validation.isValid = false
    validation.errors.push('Размер файла превышает 100MB')
  }

  // Проверка минимального размера
  if (file.size < 1024) {
    validation.isValid = false
    validation.errors.push('Файл слишком маленький для PPTX')
  }

  return validation
}

// Валидация настроек импорта
export function validateImportSettings(settings: ImportSettings): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Проверка пользовательского размера
  if (settings.slideSize === 'custom') {
    if (!settings.customWidth || settings.customWidth < 100 || settings.customWidth > 4000) {
      errors.push('Ширина должна быть от 100 до 4000 пикселей')
    }
    if (!settings.customHeight || settings.customHeight < 100 || settings.customHeight > 4000) {
      errors.push('Высота должна быть от 100 до 4000 пикселей')
    }
  }

  // Проверка, что хотя бы один элемент выбран для импорта
  if (!settings.importText && !settings.importShapes && !settings.importImages) {
    errors.push('Необходимо выбрать хотя бы один элемент для импорта')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Валидация сообщений от UI
export function validateUIMessage(message: any): message is UIMessage {
  if (!message || typeof message !== 'object') {
    return false
  }

  if (!message.type || typeof message.type !== 'string') {
    return false
  }

  const validTypes = ['import-pptx', 'cancel', 'update-progress']
  if (!validTypes.includes(message.type)) {
    return false
  }

  // Дополнительная валидация для конкретных типов
  switch (message.type) {
    case 'import-pptx':
      return validateImportPPTXMessage(message)
    case 'update-progress':
      return validateUpdateProgressMessage(message)
    case 'cancel':
      return true
    default:
      return false
  }
}

// Валидация сообщения импорта PPTX
function validateImportPPTXMessage(message: any): boolean {
  if (!message.payload || typeof message.payload !== 'object') {
    return false
  }

  const { fileName, fileData, settings } = message.payload

  if (!fileName || typeof fileName !== 'string') {
    return false
  }

  if (!fileData || !(fileData instanceof ArrayBuffer)) {
    return false
  }

  if (!settings || typeof settings !== 'object') {
    return false
  }

  const settingsValidation = validateImportSettings(settings)
  return settingsValidation.isValid
}

// Валидация сообщения обновления прогресса
function validateUpdateProgressMessage(message: any): boolean {
  if (!message.payload || typeof message.payload !== 'object') {
    return false
  }

  const { progress, currentStep } = message.payload

  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    return false
  }

  if (!currentStep || typeof currentStep !== 'string') {
    return false
  }

  return true
}

// Валидация сообщений от main процесса
export function validateMainMessage(message: any): message is MainMessage {
  if (!message || typeof message !== 'object') {
    return false
  }

  if (!message.type || typeof message.type !== 'string') {
    return false
  }

  const validTypes = ['import-started', 'import-progress', 'import-complete', 'import-error', 'notification']
  if (!validTypes.includes(message.type)) {
    return false
  }

  return true
}

// Утилиты для работы с файлами
export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('Ошибка чтения файла'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

// Получение размеров слайда из настроек
export function getSlideDimensions(settings: ImportSettings): { width: number; height: number } {
  switch (settings.slideSize) {
    case '1920x1080':
      return { width: 1920, height: 1080 }
    case '1280x720':
      return { width: 1280, height: 720 }
    case 'custom':
      return {
        width: settings.customWidth || 1920,
        height: settings.customHeight || 1080
      }
    default:
      return { width: 1920, height: 1080 }
  }
}
