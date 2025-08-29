/**
 * @file: ImportSettings.tsx
 * @description: Компонент настроек импорта PPTX
 * @dependencies: React
 * @created: 2024-12-19
 */

import React, { useState } from 'react'

interface ImportSettingsProps {
  onSettingsChange?: (settings: ImportSettings) => void
}

export interface ImportSettings {
  includeMasterBackground: boolean
  importImages: boolean
  importShapes: boolean
  importText: boolean
  slideSize: '1920x1080' | '1280x720' | 'custom'
  customWidth?: number
  customHeight?: number
}

const ImportSettings: React.FC<ImportSettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<ImportSettings>({
    includeMasterBackground: true,
    importImages: true,
    importShapes: true,
    importText: true,
    slideSize: '1920x1080'
  })

  const handleSettingChange = (key: keyof ImportSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  return (
    <div className="import-settings">
      <h3>Настройки импорта</h3>
      
      <div className="settings-group">
        <h4>Элементы для импорта</h4>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.importText}
            onChange={(e) => handleSettingChange('importText', e.target.checked)}
          />
          <span>Текст</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.importShapes}
            onChange={(e) => handleSettingChange('importShapes', e.target.checked)}
          />
          <span>Фигуры</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.importImages}
            onChange={(e) => handleSettingChange('importImages', e.target.checked)}
          />
          <span>Изображения</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.includeMasterBackground}
            onChange={(e) => handleSettingChange('includeMasterBackground', e.target.checked)}
          />
          <span>Включать фон мастера</span>
        </label>
      </div>
      
      <div className="settings-group">
        <h4>Размер слайдов</h4>
        
        <div className="size-options">
          <label className="setting-item">
            <input
              type="radio"
              name="slideSize"
              value="1920x1080"
              checked={settings.slideSize === '1920x1080'}
              onChange={(e) => handleSettingChange('slideSize', e.target.value)}
            />
            <span>1920×1080 (Full HD)</span>
          </label>
          
          <label className="setting-item">
            <input
              type="radio"
              name="slideSize"
              value="1280x720"
              checked={settings.slideSize === '1280x720'}
              onChange={(e) => handleSettingChange('slideSize', e.target.value)}
            />
            <span>1280×720 (HD)</span>
          </label>
          
          <label className="setting-item">
            <input
              type="radio"
              name="slideSize"
              value="custom"
              checked={settings.slideSize === 'custom'}
              onChange={(e) => handleSettingChange('slideSize', e.target.value)}
            />
            <span>Пользовательский</span>
          </label>
        </div>
        
        {settings.slideSize === 'custom' && (
          <div className="custom-size">
            <div className="size-input">
              <label>Ширина:</label>
              <input
                type="number"
                value={settings.customWidth || 1920}
                onChange={(e) => handleSettingChange('customWidth', parseInt(e.target.value))}
                min="100"
                max="4000"
              />
            </div>
            <div className="size-input">
              <label>Высота:</label>
              <input
                type="number"
                value={settings.customHeight || 1080}
                onChange={(e) => handleSettingChange('customHeight', parseInt(e.target.value))}
                min="100"
                max="4000"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportSettings
