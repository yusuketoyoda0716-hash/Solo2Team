import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { KanbanProvider } from '@/lib/kanban/KanbanProvider.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KanbanProvider>
      <App />
    </KanbanProvider>
  </StrictMode>,
)
