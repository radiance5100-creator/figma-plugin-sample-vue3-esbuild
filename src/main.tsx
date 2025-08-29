/**
 * @file: main.tsx
 * @description: Точка входа React приложения для UI плагина
 * @dependencies: React, ReactDOM, App
 * @created: 2024-12-19
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
