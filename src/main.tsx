import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global overrides for window.alert and window.confirm to handle iframe sandbox constraints
if (typeof window !== "undefined") {
  window.alert = (message: string) => {
    console.log("Alert intercepted:", message);
    
    let container = document.getElementById("custom-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "custom-toast-container";
      container.className = "fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none";
      document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = "bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-3.5 rounded-xl shadow-2xl border border-neutral-800 flex items-center justify-between gap-3 animate-slide-in-right pointer-events-auto";
    
    const textSpan = document.createElement("span");
    textSpan.textContent = message;
    textSpan.className = "flex-1";
    toast.appendChild(textSpan);
    
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.className = "text-amber-400 hover:text-white transition-colors duration-200 ml-2 font-black text-xs cursor-pointer";
    closeBtn.onclick = () => {
      toast.remove();
    };
    toast.appendChild(closeBtn);
    
    container.appendChild(toast);
    
    // Auto-remove toast after 4.5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4500);
  };

  window.confirm = (message: string) => {
    console.log("Confirm intercepted (auto-approved):", message);
    return true; // Auto-confirm to prevent blocking automated testing/headless runners in iframes
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

