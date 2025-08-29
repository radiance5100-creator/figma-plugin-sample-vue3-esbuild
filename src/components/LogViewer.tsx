/**
 * @file: LogViewer.tsx
 * @description: Компонент для отображения и скачивания логов
 * @dependencies: React, shared/types
 * @created: 2024-12-19
 */

import React, { useState, useRef, useEffect } from 'react'

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  source: string
  message: string
  data?: any
}

interface LogViewerProps {
  logs: LogEntry[]
  onClear?: () => void
  maxHeight?: number
}

export const LogViewer: React.FC<LogViewerProps> = ({ 
  logs, 
  onClear, 
  maxHeight = 400 
}) => {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Автоскролл к последнему логу
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  // Фильтрация логов
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.level === filter
    const matchesSearch = !search || 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.source.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Скачивание логов
  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n')

    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pptx-import-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Скачивание логов в JSON формате
  const downloadLogsJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pptx-import-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'debug': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'debug': return '🔍'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Логи импорта</h3>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Все уровни</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <input
            type="text"
            placeholder="Поиск в логах..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm w-48"
          />
          <button
            onClick={downloadLogs}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            📄 TXT
          </button>
          <button
            onClick={downloadLogsJSON}
            className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            📊 JSON
          </button>
          {onClear && (
            <button
              onClick={onClear}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
            >
              🗑️ Очистить
            </button>
          )}
        </div>
      </div>

      <div 
        ref={logContainerRef}
        className="bg-gray-50 rounded-md p-3 font-mono text-sm overflow-y-auto"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            {logs.length === 0 ? 'Логи отсутствуют' : 'Нет логов, соответствующих фильтру'}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="mb-2">
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                {getLevelIcon(log.level)} {log.level.toUpperCase()}
              </div>
              <span className="text-gray-500 ml-2">{log.timestamp}</span>
              <span className="text-blue-600 ml-2">[{log.source}]</span>
              <div className="mt-1 text-gray-800">{log.message}</div>
              {log.data && (
                <pre className="mt-1 text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                  {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Показано {filteredLogs.length} из {logs.length} записей
      </div>
    </div>
  )
}
