import { useMemo, useState } from 'react'
import { ChevronLeft, Download, Folder } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface FolderItem {
  id: number
  folderName: string
  category: 'recordings' | 'calls'
  fileCount: number
  lastModified: string
}

const FOLDERS: FolderItem[] = []

export default function FolderListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'recordings' | 'calls'>('all')
  const [selectedFolderIds, setSelectedFolderIds] = useState<Record<number, boolean>>({})

  const filteredFolders = useMemo(() => {
    return FOLDERS.filter(folder => {
      const matchesSearch = folder.folderName.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || folder.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [search, categoryFilter])

  const selectedCount = filteredFolders.filter(folder => selectedFolderIds[folder.id]).length
  const isAllSelected = filteredFolders.length > 0 && selectedCount === filteredFolders.length
  const isSomeSelected = selectedCount > 0 && !isAllSelected

  function toggleAllFolders(checked: boolean) {
    setSelectedFolderIds(prev => {
      const next = { ...prev }
      filteredFolders.forEach(folder => {
        next[folder.id] = checked
      })
      return next
    })
  }

  function toggleFolder(id: number, checked: boolean) {
    setSelectedFolderIds(prev => ({ ...prev, [id]: checked }))
  }

  function handleDownloadSelectedFolders() {
    const selectedFolders = filteredFolders
      .filter(folder => selectedFolderIds[folder.id])
      .map(folder => folder.folderName)
    console.log('폴더 다운로드 요청:', selectedFolders)
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center gap-2 px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="w-8 h-8 text-slate-400 hover:text-slate-700 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <nav className="flex items-center gap-0.5 text-sm min-w-0">
          <span className="flex items-center gap-0.5 shrink-0">
            <span className="text-slate-800 font-medium px-1 text-sm">
              루트
            </span>
          </span>
        </nav>
      </header>

      <div className="flex-1 overflow-hidden bg-slate-50">
        <div className="max-w-[1440px] mx-auto h-full flex flex-col">
          <section className="mx-6 my-6 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="h-12 shrink-0 border-b border-slate-200 flex items-center gap-3 px-6">
              {selectedCount > 0 ? (
                <>
                  <span className="text-xs font-medium text-slate-700 tabular-nums">{selectedCount}개 선택</span>
                  <Button
                    size="sm"
                    onClick={handleDownloadSelectedFolders}
                    className="h-7 px-3 text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    다운로드
                  </Button>
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                </>
              ) : (
                <span className="text-xs text-slate-400 tabular-nums">{filteredFolders.length}개</span>
              )}

              <div className="ml-auto flex items-center gap-3">
                <Input
                  placeholder="폴더명 검색..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-7 w-60 text-xs border-slate-200 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300"
                />
                <Select value={categoryFilter} onValueChange={(value: 'all' | 'recordings' | 'calls') => setCategoryFilter(value)}>
                  <SelectTrigger className="h-7 w-28 text-xs border-slate-200 focus:ring-1 focus:ring-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">전체</SelectItem>
                    <SelectItem value="recordings" className="text-xs">recordings</SelectItem>
                    <SelectItem value="calls" className="text-xs">calls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50">
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="h-10 px-6 w-[52px]">
                      <Checkbox
                        checked={isSomeSelected ? 'indeterminate' : isAllSelected}
                        onCheckedChange={checked => toggleAllFolders(!!checked)}
                        aria-label="전체 폴더 선택"
                        className="border-slate-300"
                      />
                    </TableHead>
                    <TableHead className="h-10 px-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">#</TableHead>
                    <TableHead className="h-10 px-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">폴더명</TableHead>
                    <TableHead className="h-10 px-6 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">파일 수</TableHead>
                    <TableHead className="h-10 px-6 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">최종 수정</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredFolders.map(folder => (
                    <TableRow
                      key={folder.id}
                      onClick={() => {
                        if (selectedCount > 0) toggleFolder(folder.id, !selectedFolderIds[folder.id])
                        else navigate(`/${encodeURIComponent(folder.folderName)}`)
                      }}
                      className="group h-[52px] border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <TableCell className="px-6">
                        <Checkbox
                          checked={!!selectedFolderIds[folder.id]}
                          onCheckedChange={checked => toggleFolder(folder.id, !!checked)}
                          onClick={e => e.stopPropagation()}
                          aria-label="폴더 선택"
                          className="border-slate-300"
                        />
                      </TableCell>
                      <TableCell className="px-6 text-xs text-slate-400 font-mono tabular-nums">{folder.id}</TableCell>
                      <TableCell className="px-6">
                        <span className="flex items-center gap-3 min-w-0">
                          <Folder className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-slate-400 transition-colors" />
                          <span className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                            {folder.folderName}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="px-6 text-right text-sm text-slate-400 font-mono tabular-nums">{folder.fileCount}</TableCell>
                      <TableCell className="px-6 text-right text-sm text-slate-400 font-mono tabular-nums">{folder.lastModified}</TableCell>
                    </TableRow>
                  ))}

                  {filteredFolders.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="h-32 text-center text-sm text-slate-400">
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
