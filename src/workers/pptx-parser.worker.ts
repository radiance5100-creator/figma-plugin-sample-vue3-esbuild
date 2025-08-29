/**
 * @file: pptx-parser.worker.ts
 * @description: Web Worker for PPTX parsing
 * @dependencies: adapters/pptx-adapter.ts
 * @created: 2024-12-19
 */

import { PPTXAdapter } from '../adapters/pptx-adapter'
import { ParseProgress, ParseResult } from '../shared/types'

// Worker context
const ctx: Worker = self as any

// Handle messages from main thread
ctx.addEventListener('message', async (event) => {
  try {
    const { type, payload } = event.data
    console.log('Worker received message:', type, payload)

    switch (type) {
      case 'parse-pptx':
        await handleParsePPTX(payload)
        break
        
      case 'cancel':
        // Handle cancellation if needed
        break
        
      default:
        ctx.postMessage({
          type: 'error',
          payload: {
            error: `Unknown message type: ${type}`
          }
        })
    }
  } catch (error) {
    console.error('Worker error handling message:', error)
    ctx.postMessage({
      type: 'error',
      payload: {
        error: `Worker error: ${error.message}`
      }
    })
  }
})

// Handle PPTX parsing
async function handleParsePPTX(payload: { fileData: ArrayBuffer; fileName: string }) {
  try {
    const { fileData, fileName } = payload
    console.log('Starting PPTX parsing for:', fileName, 'Size:', fileData.byteLength)
    
    // Create adapter with progress callback
    const adapter = new PPTXAdapter((progress: ParseProgress) => {
      console.log('Parsing progress:', progress)
      ctx.postMessage({
        type: 'progress',
        payload: progress
      })
    })
    
    // Parse PPTX file
    const result: ParseResult = await adapter.parsePPTX(fileData, fileName)
    console.log('Parsing completed:', result)
    
    // Send result back to main thread
    ctx.postMessage({
      type: 'complete',
      payload: result
    })
    
  } catch (error) {
    console.error('PPTX parsing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    ctx.postMessage({
      type: 'error',
      payload: {
        error: errorMessage
      }
    })
  }
}

// Export for TypeScript
export {}
