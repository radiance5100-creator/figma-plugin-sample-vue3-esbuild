/**
 * @file: ProgressBar.tsx
 * @description: Компонент прогресс-бара для отображения процесса импорта
 * @dependencies: React
 * @created: 2024-12-19
 */

import React from 'react'

interface ProgressBarProps {
  progress: number
  currentStep: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, currentStep }) => {
  return (
    <div className="progress-container">
      <div className="progress-info">
        <span className="current-step">{currentStep}</span>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="progress-steps">
        <div className={`step ${progress >= 20 ? 'completed' : ''}`}>
          <div className="step-icon">📄</div>
          <span>Парсинг</span>
        </div>
        <div className={`step ${progress >= 40 ? 'completed' : ''}`}>
          <div className="step-icon">🖼️</div>
          <span>Слайды</span>
        </div>
        <div className={`step ${progress >= 60 ? 'completed' : ''}`}>
          <div className="step-icon">🖼️</div>
          <span>Медиа</span>
        </div>
        <div className={`step ${progress >= 80 ? 'completed' : ''}`}>
          <div className="step-icon">🎨</div>
          <span>Рендеринг</span>
        </div>
        <div className={`step ${progress >= 100 ? 'completed' : ''}`}>
          <div className="step-icon">✅</div>
          <span>Готово</span>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
