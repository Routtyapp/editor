import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import MainPage from './pages/MainPage'
import EditorPage from './pages/EditorPage'
import FolderListPage from './pages/FolderListPage'

export default function App() {
  return (
    <TooltipProvider delayDuration={400}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FolderListPage />} />
          <Route path="/:categoryId/:folderName" element={<MainPage />} />
          <Route path="/:categoryId/:folderName/:documentId" element={<EditorPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
