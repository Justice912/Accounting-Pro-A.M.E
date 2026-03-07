import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIProviderProvider } from './contexts/AIProviderContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ToastProvider } from './components/shared/Toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AIProviderProvider>
          <WorkspaceProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </WorkspaceProvider>
        </AIProviderProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
