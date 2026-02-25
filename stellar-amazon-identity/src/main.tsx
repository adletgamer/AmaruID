import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initI18n } from '@/lib/i18n/config';
import './index.css';
import App from './App';

initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
