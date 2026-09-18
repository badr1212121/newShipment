import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import ApiErrorToaster from './components/ApiErrorToaster'
import { Toaster } from '@/components/ui/use-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster />
        <ApiErrorToaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
