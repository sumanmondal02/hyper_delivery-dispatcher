import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1a1a1a',
          color: '#f0f0f0',
          border: '1px solid #2e2e2e',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: { iconTheme: { primary: '#00c853', secondary: '#1a1a1a' } },
        error:   { iconTheme: { primary: '#ff3b30', secondary: '#1a1a1a' } },
      }}
    />
  </StrictMode>
);