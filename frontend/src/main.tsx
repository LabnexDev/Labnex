import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HelmetProvider } from 'react-helmet-async'

// IMMEDIATE CONSOLE FILTERING - RUNS BEFORE REACT LOADS
(function() {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Override console.error to filter out known issues
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    
    // Filter out Cloudflare deprecation warnings
    if (message.includes('StorageType.persistent is deprecated') ||
        message.includes('Failed to load resource') ||
        message.includes('cdn-cgi') ||
        message.includes('challenge-platform') ||
        message.includes('Mixed Content')) {
      return; // Suppress these completely
    }
    
    originalConsoleError.apply(console, args);
  };

  // Override console.warn to filter GitHub Pages warnings
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    
    // Filter out known GitHub Pages warnings
    if (message.includes('StorageType.persistent is deprecated') ||
        message.includes('Failed to load resource') ||
        message.includes('Mixed Content') ||
        message.includes('cdn-cgi') ||
        message.includes('challenge-platform')) {
      return; // Suppress these warnings completely
    }
    
    originalConsoleWarn.apply(console, args);
  };

  // Override console.log to filter some warnings
  console.log = function(...args: any[]) {
    const message = args.join(' ');
    
    // Filter out deprecation messages
    if (message.includes('StorageType.persistent is deprecated')) {
      return; // Suppress these logs
    }
    
    originalConsoleLog.apply(console, args);
  };

  // Override any potential deprecated API usage
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'StorageType', {
      get: function() {
        return {
          persistent: 'persistent',
          temporary: 'temporary'
        };
      },
      configurable: true
    });
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)
