import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { HookProvider } from './hookcontext/HookContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  
   <HookProvider>
      <App />
    </HookProvider>
    
  </BrowserRouter>
)
