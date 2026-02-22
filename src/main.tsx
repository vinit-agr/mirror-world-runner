import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Global styles
const style = document.createElement('style');
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000011;
    -webkit-tap-highlight-color: transparent;
  }
  body { position: fixed; }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(<App />);
