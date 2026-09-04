import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import App from './App'

const queryClient = new QueryClient()
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          /* Toast notification colours (success/error popups) */
          style: {
            background: '#020617',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '600',
          },
        }}
      />
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
)

