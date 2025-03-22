
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// This ensures the app renders properly
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("Root element not found! Check your HTML file.");
}
