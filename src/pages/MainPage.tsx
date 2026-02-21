import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { FileText, ArrowUpDown, ArrowUp, ArrowDown, Download, FileArchive, Files } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  fileSize: number  // bytes
  isCompleted: boolean
}

// ── Mock data (replace with API call) ─────────────────────────────────────

const SPEAKER_PAIRS = [
  ['구강모', '유정우'], ['박민준', '이서연'], ['김태호', '정유진'],
  ['최동현', '강수아'], ['윤성민', '임지현'], ['장현우', '오세영'],
  ['한재원', '신민서'], ['류성훈', '백지수'], ['권혁준', '문소희'],
  ['송태양', '조예린'], ['남기현', '황보선'], ['엄준식', '홍다혜'],
]

function generateMockData(count = 900): FileItem[] {
  return Array.from({ length: count }, (_, i) => {
    const pair = SPEAKER_PAIRS[i % SPEAKER_PAIRS.length]
    const date = new Date(2025, 5, 1 + (i % 90))
    const yy = String(date.getFullYear()).slice(2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return {
      id: i + 1,
      fileName: `${yy}${mm}${dd}_${pair[0]}_${pair[1]}_${String(i + 1).padStart(3, '0')}.txt`,
      lastModified: `${yy}.${mm}.${dd}`,
      fileSize: 8192 + ((i * 3571) % 1_040_384),
      isCompleted: i % 4 === 0,
    }
  })
}

const DATA = generateMockData()
const PAGE_SIZE = 20

// ── Column definitions ─────────────────────────────────────────────────────

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ArrowUp className="ml-1.5 h-3 w-3" />
  if (isSorted === 'desc') return <ArrowDown className="ml-1.5 h-3 w-3" />
  return <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-300" />
}

const columns: ColumnDef<FileItem>[] = [
  {
    id: 'select',
    header: ({ table }) => {
      const allFilteredRows = table.getFilteredRowModel().rows
      const selectedCount = allFilteredRows.filter(r => r.getIsSelected()).length
      const isAllSelected = selectedCount === allFilteredRows.length && allFilteredRows.length > 0
      const isSomeSelected = selectedCount > 0 && !isAllSelected
      return (
        <Checkbox
          checked={isSomeSelected ? 'indeterminate' : isAllSelected}
          onCheckedChange={checked => {
            allFilteredRows.forEach(row => row.toggleSelected(!!checked))
          }}
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
    header: ({ column }) => (
      <button
        className="flex items-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        #<SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => (
      <span className="text-xs text-slate-400 font-mono tabular-nums">{getValue<number>()}</span>
    ),
    size: 56,
  },
  {
    accessorKey: 'fileName',
    header: ({ column }) => (
      <button
        className="flex items-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        파일명<SortIcon isSorted={column.getIsSorted()} />
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
    header: ({ column }) => (
      <button
        className="flex items-center ml-auto text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        파일 크기<SortIcon isSorted={column.getIsSorted()} />
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
    header: ({ column }) => (
      <button
        className="flex items-center ml-auto text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        최근 수정<SortIcon isSorted={column.getIsSorted()} />
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
    accessorKey: 'isCompleted',
    header: () => (
      <span className="block text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
        완료 여부
      </span>
    ),
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <span className="flex justify-end">
          <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[11px] font-medium px-2.5 py-0.5 hover:bg-emerald-50">
            완료
          </Badge>
        </span>
      ) : (
        <span className="flex justify-end">
          <Badge className="bg-slate-100 text-slate-500 border-0 text-[11px] font-medium px-2.5 py-0.5 hover:bg-slate-100">
            미완료
          </Badge>
        </span>
      ),
    size: 112,
    filterFn: (row, _id, filterValue) => {
      if (filterValue === 'all') return true
      return filterValue === 'completed' ? row.original.isCompleted : !row.original.isCompleted
    },
  },
]

// ── Page ───────────────────────────────────────────────────────────────────

export default function MainPage() {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadType, setDownloadType] = useState<'individual' | 'zip'>('individual')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => DATA, [])

  const table = useReactTable({
    data,
    columns,
    getRowId: row => String(row.id),
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: updater => { setSorting(updater); setVisibleCount(PAGE_SIZE) },
    onColumnFiltersChange: updater => { setColumnFilters(updater); setVisibleCount(PAGE_SIZE) },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  })

  const allFilteredRows = table.getFilteredRowModel().rows
  const visibleRows = allFilteredRows.slice(0, visibleCount)
  const hasMore = visibleCount < allFilteredRows.length
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE)
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

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    table.getColumn('isCompleted')?.setFilterValue(value)
  }

  function handleDownload() {
    const selectedFiles = allFilteredRows
      .filter(row => rowSelection[row.id])
      .map(row => row.original.fileName)
    console.log(`다운로드 요청 (${downloadType}):`, selectedFiles)
    // TODO: 개별 → GET /api/files/:id/download 순차 호출
    //       zip  → POST /api/download/zip { files: selectedFiles } → Presigned URL
    setDownloadOpen(false)
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <div className="max-w-[1440px] mx-auto h-full flex flex-col">

        {/* ── Header ── */}
        <header className="h-16 shrink-0 flex items-center px-10">
          <h1 className="text-base font-semibold text-slate-900">파일 목록</h1>
        </header>

        {/* ── DataTable Section ── */}
        <section className="mx-10 mb-10 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col flex-1 min-h-0">

          {/* Toolbar */}
          <div className="h-12 shrink-0 border-b border-slate-200 flex items-center gap-3 px-6">
            {/* 선택 카운트 + 다운로드 */}
            {selectedCount > 0 ? (
              <>
                <span className="text-xs font-medium text-slate-700 tabular-nums">
                  {selectedCount}개 선택됨
                </span>
                <Button
                  size="sm"
                  onClick={() => setDownloadOpen(true)}
                  className="h-7 px-3 text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  다운로드
                </Button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
              </>
            ) : (
              <span className="text-xs text-slate-400 tabular-nums">
                {allFilteredRows.length}개
              </span>
            )}

            <div className="ml-auto flex items-center gap-3">
              <Input
                placeholder="파일명 검색..."
                value={(table.getColumn('fileName')?.getFilterValue() as string) ?? ''}
                onChange={e => table.getColumn('fileName')?.setFilterValue(e.target.value)}
                className="h-7 w-60 text-xs border-slate-200 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300"
              />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-28 text-xs border-slate-200 focus:ring-1 focus:ring-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체</SelectItem>
                  <SelectItem value="completed" className="text-xs">완료</SelectItem>
                  <SelectItem value="incomplete" className="text-xs">미완료</SelectItem>
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
                {visibleRows.length ? (
                  visibleRows.map(row => (
                    <TableRow
                      key={row.id}
                      onClick={() => { if (selectedCount > 0) row.toggleSelected(); else navigate(`/${encodeURIComponent(row.original.fileName)}`) }}
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
            ) : visibleRows.length > 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                {allFilteredRows.length}개 전체 로드 완료
              </p>
            ) : null}
          </div>

        </section>

      </div>

      {/* ── Download Modal ── */}
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">다운로드</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-500 -mt-1">
            {selectedCount}개 파일을 어떻게 다운로드할까요?
          </p>

          {/* 옵션 */}
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              onClick={() => setDownloadType('individual')}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-colors text-left ${
                downloadType === 'individual'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Files className={`w-7 h-7 ${downloadType === 'individual' ? 'text-slate-900' : 'text-slate-400'}`} />
              <div>
                <p className={`text-sm font-medium ${downloadType === 'individual' ? 'text-slate-900' : 'text-slate-600'}`}>
                  개별 다운로드
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  파일을 각각 따로<br />다운로드합니다
                </p>
              </div>
            </button>

            <button
              onClick={() => setDownloadType('zip')}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-colors text-left ${
                downloadType === 'zip'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <FileArchive className={`w-7 h-7 ${downloadType === 'zip' ? 'text-slate-900' : 'text-slate-400'}`} />
              <div>
                <p className={`text-sm font-medium ${downloadType === 'zip' ? 'text-slate-900' : 'text-slate-600'}`}>
                  ZIP 다운로드
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  하나의 ZIP 파일로<br />묶어서 다운로드합니다
                </p>
              </div>
            </button>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDownloadOpen(false)}
              className="h-8 px-4 text-xs text-slate-600"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="h-8 px-4 text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              다운로드
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
