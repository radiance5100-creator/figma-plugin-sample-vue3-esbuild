/**
 * @file: ResultsPanel.tsx
 * @description: Компонент панели результатов импорта
 * @dependencies: React
 * @created: 2024-12-19
 */

import React from 'react'

interface ResultsPanelProps {
  results: {
    slidesImported: number
    warnings: string[]
    errors: string[]
  }
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results }) => {
  return (
    <div className="results-panel">
      <div className="results-summary">
        <div className="summary-item success">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h4>Успешно импортировано</h4>
            <p>{results.slidesImported} слайдов</p>
          </div>
        </div>
      </div>
      
      {results.warnings.length > 0 && (
        <div className="results-section">
          <h4 className="section-title warning">
            ⚠️ Предупреждения ({results.warnings.length})
          </h4>
          <ul className="warnings-list">
            {results.warnings.map((warning, index) => (
              <li key={index} className="warning-item">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {results.errors.length > 0 && (
        <div className="results-section">
          <h4 className="section-title error">
            ❌ Ошибки ({results.errors.length})
          </h4>
          <ul className="errors-list">
            {results.errors.map((error, index) => (
              <li key={index} className="error-item">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {results.warnings.length === 0 && results.errors.length === 0 && (
        <div className="results-section">
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <p>Импорт завершен успешно!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsPanel
