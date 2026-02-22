import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchDocuments, downloadDocuments } from '@/lib/api'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table'
import { FileText, ArrowUpDown, ArrowUp, ArrowDown, Download, FileArchive, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

// ── Types ──────────────────────────────────────────────────────────────────

interface FileItem {
  id: number
  fileName: string
  lastModified: string
  fileSize: number
  status: 'pending' | 'in_progress' | 'completed'
}

interface FetchParams {
  q: string
  progress: string
  sortBy: string
  order: 'asc' | 'desc'
  page: number
}

const PAGE_SIZE = 20

// 프론트 컬럼 키 → 백엔드 sort_by 파라미터 매핑
const SORT_KEY_MAP: Record<string, string> = {
  id: 'id',
  fileName: 'title',
  fileSize: 'file_size',
  lastModified: 'updated_at',
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ArrowUp className="ml-1.5 h-3 w-3" />
  if (isSorted === 'desc') return <ArrowDown className="ml-1.5 h-3 w-3" />
  return <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-300" />
}

function StatusBadge({ status }: { status: FileItem['status'] }) {
  if (status === 'completed')
    return <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[11px] font-medium px-2.5 py-0.5 hover:bg-emerald-50">완료</Badge>
  if (status === 'in_progress')
    return <Badge className="bg-blue-50 text-blue-700 border-0 text-[11px] font-medium px-2.5 py-0.5 hover:bg-blue-50">진행중</Badge>
  return <Badge className="bg-slate-100 text-slate-500 border-0 text-[11px] font-medium px-2.5 py-0.5 hover:bg-slate-100">미시작</Badge>
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MainPage() {
  const { categoryId, folderName } = useParams<{ categoryId: string; folderName: string }>()
  const navigate = useNavigate()
  const decodedFolderName = folderName ? decodeURIComponent(folderName) : '폴더'

  const [data, setData] = useState<FileItem[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [params, setParams] = useState<FetchParams>({
    q: '',
    progress: 'all',
    sortBy: 'id',
    order: 'asc',
    page: 1,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 검색 입력 디바운스 → params.q 업데이트
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => {
        if (prev.q === searchInput) return prev
        return { ...prev, q: searchInput, page: 1 }
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // 파라미터 변경 시 서버에서 데이터 fetch
  useEffect(() => {
    if (!categoryId) return
    fetchDocuments({
      categoryId: Number(categoryId),
      q: params.q || undefined,
      progress: params.progress !== 'all' ? params.progress : undefined,
      sortBy: params.sortBy,
      order: params.order,
      page: params.page,
      size: PAGE_SIZE,
    }).then(docs => {
      const items: FileItem[] = docs.map(d => ({
        id: d.id,
        fileName: d.title,
        lastModified: new Date(d.updated_at).toLocaleDateString('ko-KR'),
        fileSize: d.file_size,
        status: d.status,
      }))
      setData(prev => params.page === 1 ? items : [...prev, ...items])
      setHasMore(docs.length === PAGE_SIZE)
    })
  }, [categoryId, params])

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleSort(colKey: string) {
    const backendKey = SORT_KEY_MAP[colKey] ?? colKey
    setParams(prev => ({
      ...prev,
      sortBy: backendKey,
      order: prev.sortBy === backendKey && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  function handleStatusChange(value: string) {
    setParams(prev => ({ ...prev, progress: value, page: 1 }))
  }

  function getSortedState(colKey: string): false | 'asc' | 'desc' {
    const backendKey = SORT_KEY_MAP[colKey] ?? colKey
    return params.sortBy === backendKey ? params.order : false
  }

  // ── Column definitions ──────────────────────────────────────────────────

  const columns: ColumnDef<FileItem>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const allRows = table.getCoreRowModel().rows
        const selectedCount = allRows.filter(r => r.getIsSelected()).length
        const isAllSelected = selectedCount === allRows.length && allRows.length > 0
        const isSomeSelected = selectedCount > 0 && !isAllSelected
        return (
          <Checkbox
            checked={isSomeSelected ? 'indeterminate' : isAllSelected}
            onCheckedChange={checked => allRows.forEach(row => row.toggleSelected(!!checked))}
            aria-label="전체 선택"
            className="border-slate-300"
          />
        )
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={row.getToggleSelectedHandler()}
          onClick={e => e.stopPropagation()}
          aria-label="행 선택"
          className="border-slate-300"
        />
      ),
      size: 44,
      enableSorting: false,
    },
    {
      accessorKey: 'id',
      header: () => (
        <button
          className="flex items-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => handleSort('id')}
        >
          #<SortIcon isSorted={getSortedState('id')} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-400 font-mono tabular-nums">{getValue<number>()}</span>
      ),
      size: 56,
    },
    {
      accessorKey: 'fileName',
      header: () => (
        <button
          className="flex items-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => handleSort('fileName')}
        >
          파일명<SortIcon isSorted={getSortedState('fileName')} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="flex items-center gap-3 min-w-0">
          <FileText className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-slate-400 transition-colors" />
          <span className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors">
            {getValue<string>()}
          </span>
        </span>
      ),
    },
    {
      accessorKey: 'fileSize',
      header: () => (
        <button
          className="flex items-center ml-auto text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => handleSort('fileSize')}
        >
          파일 크기<SortIcon isSorted={getSortedState('fileSize')} />
        </button>
      ),
      cell: ({ getValue }) => {
        const bytes = getValue<number>()
        const formatted = bytes >= 1_048_576
          ? `${(bytes / 1_048_576).toFixed(1)} MB`
          : `${Math.round(bytes / 1024)} KB`
        return (
          <span className="block text-right text-sm text-slate-400 font-mono tabular-nums">
            {formatted}
          </span>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'lastModified',
      header: () => (
        <button
          className="flex items-center ml-auto text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => handleSort('lastModified')}
        >
          최근 수정<SortIcon isSorted={getSortedState('lastModified')} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="block text-right text-sm text-slate-400 font-mono tabular-nums">
          {getValue<string>()}
        </span>
      ),
      size: 144,
    },
    {
      accessorKey: 'status',
      header: () => (
        <span className="block text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
          완료 여부
        </span>
      ),
      cell: ({ getValue }) => (
        <span className="flex justify-end">
          <StatusBadge status={getValue<FileItem['status']>()} />
        </span>
      ),
      size: 112,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getRowId: row => String(row.id),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  })

  const allRows = table.getCoreRowModel().rows
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  // 무한 스크롤: sentinel 진입 시 다음 페이지 요청
  const loadMore = useCallback(() => {
    setParams(prev => ({ ...prev, page: prev.page + 1 }))
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) loadMore() },
      { root: scrollRef.current, threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.unobserve(el)
  }, [hasMore, loadMore])

  async function handleDownload() {
    const selectedIds = allRows
      .filter(row => rowSelection[row.id])
      .map(row => row.original.id)
    if (selectedIds.length === 0) return
    setIsDownloading(true)
    try {
      await downloadDocuments(selectedIds)
      setRowSelection({})
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center gap-2 px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="w-8 h-8 text-slate-400 hover:text-slate-700 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <nav className="flex items-center gap-0.5 text-sm min-w-0">
          <span className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-slate-400 px-1 text-xs hover:text-slate-700"
            >
              카테고리
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            <span className="text-slate-800 font-medium px-1 text-sm">{decodedFolderName}</span>
          </span>
        </nav>
      </header>

      <div className="flex-1 overflow-hidden bg-slate-50">
        <div className="max-w-[1440px] mx-auto h-full flex flex-col">
          {/* ── DataTable Section ── */}
          <section className="mx-6 my-6 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col flex-1 min-h-0">

          {/* Toolbar */}
          <div className="h-12 shrink-0 border-b border-slate-200 flex items-center gap-3 px-6">
            {selectedCount > 0 ? (
              <>
                <span className="text-xs font-medium text-slate-700 tabular-nums">
                  {selectedCount}개 선택됨
                </span>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="h-7 px-3 text-xs gap-1.5"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      다운로드 중...
                    </>
                  ) : selectedCount === 1 ? (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      DOCX 다운로드
                    </>
                  ) : (
                    <>
                      <FileArchive className="w-3.5 h-3.5" />
                      ZIP 다운로드
                    </>
                  )}
                </Button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
              </>
            ) : (
              <span className="text-xs text-slate-400 tabular-nums">
                {data.length}개{hasMore ? '+' : ''}
              </span>
            )}

            <div className="ml-auto flex items-center gap-3">
              <Input
                placeholder="파일명 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="h-7 w-60 text-xs border-slate-200 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300"
              />
              <Select value={params.progress} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-28 text-xs border-slate-200 focus:ring-1 focus:ring-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체</SelectItem>
                  <SelectItem value="completed" className="text-xs">완료</SelectItem>
                  <SelectItem value="in_progress" className="text-xs">진행중</SelectItem>
                  <SelectItem value="pending" className="text-xs">미시작</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scrollable Table Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50">
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id} className="border-b border-slate-200 hover:bg-transparent">
                    {hg.headers.map(header => (
                      <TableHead
                        key={header.id}
                        className="h-10 px-6"
                        style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {allRows.length ? (
                  allRows.map(row => (
                    <TableRow
                      key={row.id}
                      onClick={() => {
                        if (selectedCount > 0) row.toggleSelected()
                        else navigate(`/${categoryId}/${encodeURIComponent(decodedFolderName)}/${row.original.id}`)
                      }}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className="group h-[52px] border-b border-slate-100 hover:bg-slate-50 data-[state=selected]:bg-blue-50/60 cursor-pointer transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          className="px-6"
                          style={cell.column.columnDef.size ? { width: cell.column.columnDef.size } : undefined}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-slate-400">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Sentinel */}
            {hasMore ? (
              <div ref={sentinelRef} className="h-12 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
              </div>
            ) : allRows.length > 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                {data.length}개 전체 로드 완료
              </p>
            ) : null}
          </div>

          </section>
        </div>
      </div>

    </div>
  )
}
