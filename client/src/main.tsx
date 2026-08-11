import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App'
import { AuthProvider } from './context'

import './styles/main.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache queries for 5 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>
    </AuthProvider>
  </QueryClientProvider>
)
