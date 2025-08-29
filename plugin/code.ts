/**
 * @file: code.ts
 * @description: Основной код плагина для обработки PPTX файлов
 * @dependencies: Figma Plugin API, PPTXParser
 * @created: 2024-12-19
 */

// Полифилл для setImmediate (недоступен в Figma)
if (typeof setImmediate === 'undefined') {
  (globalThis as any).setImmediate = (callback: Function, ...args: any[]) => {
    return setTimeout(() => callback(...args), 0)
  }
}

figma.showUI(__html__, { themeColors: true, height: 400 })

// Обработка сообщений от UI
figma.ui.onmessage = async (msg) => {
  try {
    console.log('Main process received message:', msg)
    
    // Валидация сообщения
    if (!msg || typeof msg !== 'object' || !msg.type) {
      sendError('Неверный формат сообщения')
      return
    }

    switch (msg.type) {
      case 'render-pptx':
        await handleRenderPPTX(msg.payload)
        break

      case 'cancel':
        figma.closePlugin()
        break

      default:
        sendError(`Неизвестный тип сообщения: ${msg.type}`)
    }
  } catch (error) {
    console.error('Main process error:', error)
    sendError(`Ошибка обработки сообщения: ${error.message}`)
  }
}

// Обработка рендеринга PPTX
async function handleRenderPPTX(payload: any) {
  try {
    const { pptxData, settings } = payload
    console.log('Starting render with payload:', { pptxData, settings })

    // Валидация payload
    if (!pptxData || !settings) {
      sendError('Неполные данные для рендеринга')
      return
    }

    // Отправка уведомления о начале рендеринга
    figma.notify(`Начинаем рендеринг: ${pptxData.fileName}`)

    // Отправка сообщения о начале рендеринга
    sendMessage({
      type: 'import-started',
      payload: {
        totalSlides: pptxData.slides?.length || 0
      }
    })

    // Создание фреймов на основе распарсенных данных
    await createFramesFromPPTX(pptxData, settings)

    // Отправка сообщения о завершении
    sendMessage({
      type: 'import-complete',
      payload: {
        slidesImported: pptxData.slides?.length || 0,
        warnings: [],
        errors: []
      }
    })

    figma.notify('Рендеринг завершен успешно!')

  } catch (error) {
    console.error('Render error:', error)
    sendError(`Ошибка рендеринга: ${error.message}`)
  }
}

// Создание фреймов из PPTX данных
async function createFramesFromPPTX(pptxData: any, settings: any) {
  const { slides } = pptxData
  
  // Получение размеров слайда
  const dimensions = getSlideDimensions(settings)
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    
    // Отправка прогресса
    sendMessage({
      type: 'import-progress',
      payload: {
        progress: 80 + (i / slides.length) * 20,
        currentStep: `Создание слайда ${i + 1}/${slides.length}...`,
        currentSlide: i + 1,
        totalSlides: slides.length
      }
    })

    // Создание фрейма для слайда
    const frame = figma.createFrame()
    frame.name = `Slide ${i + 1} - ${slide.name || 'Untitled'}`
    frame.resize(dimensions.width, dimensions.height)
    
    // Позиционирование фреймов
    frame.x = i * (dimensions.width + 100)
    frame.y = 0

    // Добавление фона
    frame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }]

    // Создание заголовка слайда
    const title = figma.createText()
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
    title.characters = slide.name || `Slide ${i + 1}`
    title.fontSize = 24
    title.x = 50
    title.y = 50
    title.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }]

    // Создание описания
    const description = figma.createText()
    description.characters = `Элементов: ${slide.elements?.length || 0}`
    description.fontSize = 16
    description.x = 50
    description.y = 100
    description.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }]

    // Добавление элементов в фрейм
    frame.appendChild(title)
    frame.appendChild(description)

    // Добавление фрейма на страницу
    figma.currentPage.appendChild(frame)
  }

  // Выбор всех созданных фреймов
  const frames = figma.currentPage.children.filter(child => 
    child.name.startsWith('Slide ')
  )
  
  if (frames.length > 0) {
    figma.currentPage.selection = frames
    figma.viewport.scrollAndZoomIntoView(frames)
  }
}

// Получение размеров слайда из настроек
function getSlideDimensions(settings: any): { width: number; height: number } {
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

// Отправка сообщения в UI
function sendMessage(message: any) {
  figma.ui.postMessage(message)
}

// Отправка ошибки
function sendError(error: string) {
  sendMessage({
    type: 'import-error',
    payload: {
      error,
      details: new Date().toISOString()
    }
  })
  
  figma.notify(error, { error: true })
}

// Рендерер для создания Figma узлов
class PPTXRenderer {
  // Методы рендеринга будут добавлены позже
}
