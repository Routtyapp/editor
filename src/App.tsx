import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import MainPage from './pages/MainPage'
import EditorPage from './pages/EditorPage'

export default function App() {
  return (
    <TooltipProvider delayDuration={400}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/:filename" element={<EditorPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
