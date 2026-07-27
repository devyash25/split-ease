import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(12px)',
            color: '#f1f5f9',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            padding: '0.75rem 1rem',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
