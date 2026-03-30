import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ViewModeProvider } from './contexts/ViewModeContext'
import './index.css'

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW зарегистрирован:', registration.scope);

        // Проверяем обновления каждые 30 минут
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
      })
      .catch((error) => {
        console.error('SW ошибка:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewModeProvider>
      <App />
    </ViewModeProvider>
  </React.StrictMode>,
)
