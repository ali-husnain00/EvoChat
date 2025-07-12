import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ChatContextProvider from './components/Context.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChatContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChatContextProvider>
  </StrictMode>
)
