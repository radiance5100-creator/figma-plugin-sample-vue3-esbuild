/**
 * @file: App.tsx
 * @description: Главный компонент React приложения
 * @dependencies: React, PPTXImporter
 * @created: 2024-12-19
 */

import React from 'react'
import PPTXImporter from './components/PPTXImporter'

const App: React.FC = () => {
  return (
    <div className="app">
      <PPTXImporter />
    </div>
  )
}

export default App
