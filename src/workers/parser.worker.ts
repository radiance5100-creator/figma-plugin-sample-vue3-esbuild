/**
 * @file: parser.worker.ts
 * @description: Web Worker для фонового парсинга PPTX файлов
 * @dependencies: PPTXParser, types
 * @created: 2024-12-19
 */

import { PPTXParser } from '../parser/PPTXParser'
import { ParseResult, ParserState } from '../parser/types'

// Типы сообщений для Web Worker
interface WorkerMessage {
  type: 'parse' | 'cancel'
  id: string
  payload?: any
}

interface ParseMessage extends WorkerMessage {
  type: 'parse'
  payload: {
    fileData: ArrayBuffer
    fileName: string
  }
}

interface WorkerResponse {
  id: string
  type: 'progress' | 'complete' | 'error'
  payload: any
}

// Глобальная переменная для хранения парсера
let parser: PPTXParser | null = null

// Обработчик сообщений
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data

  try {
    switch (message.type) {
      case 'parse':
        await handleParse(message as ParseMessage)
        break

      case 'cancel':
        handleCancel(message)
        break

      default:
        sendError(message.id, `Unknown message type: ${message.type}`)
    }
  } catch (error) {
    sendError(message.id, `Worker error: ${error.message}`)
  }
}

// Обработка парсинга
async function handleParse(message: ParseMessage): Promise<void> {
  const { fileData, fileName } = message.payload

  try {
    // Создание парсера с callback для прогресса
    parser = new PPTXParser((state: ParserState) => {
      sendProgress(message.id, state)
    })

    // Запуск парсинга
    const result = await parser.parse(fileData, fileName)

    // Отправка результата
    sendComplete(message.id, result)

  } catch (error) {
    sendError(message.id, `Parse error: ${error.message}`)
  } finally {
    parser = null
  }
}

// Обработка отмены
function handleCancel(message: WorkerMessage): void {
  // В текущей реализации парсер не поддерживает отмену
  // Можно добавить флаг для прерывания процесса
  sendProgress(message.id, {
    isParsing: false,
    progress: 0,
    currentStep: 'Отменено',
    errors: [],
    warnings: []
  })
}

// Отправка прогресса
function sendProgress(id: string, state: ParserState): void {
  const response: WorkerResponse = {
    id,
    type: 'progress',
    payload: state
  }
  
  self.postMessage(response)
}

// Отправка результата
function sendComplete(id: string, result: ParseResult): void {
  const response: WorkerResponse = {
    id,
    type: 'complete',
    payload: result
  }
  
  self.postMessage(response)
}

// Отправка ошибки
function sendError(id: string, error: string): void {
  const response: WorkerResponse = {
    id,
    type: 'error',
    payload: { error }
  }
  
  self.postMessage(response)
}

// Обработка ошибок
self.onerror = (error: ErrorEvent) => {
  console.error('Worker error:', error)
  // Отправляем ошибку в основной поток
  self.postMessage({
    id: 'error',
    type: 'error',
    payload: { error: error.message }
  })
}

// Обработка необработанных отклонений промисов
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason)
  self.postMessage({
    id: 'error',
    type: 'error',
    payload: { error: event.reason?.message || 'Unhandled promise rejection' }
  })
}
