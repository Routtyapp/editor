import { useState, useRef, useEffect } from 'react'
import { Trash2, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { TranscriptData, TranscriptLine, Character } from '@/types'

interface MainEditorProps {
  transcript: TranscriptData
  setTranscript: (data: TranscriptData) => void
  characters: Character[]
  audioTime?: number
}

function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function MainEditor({ transcript, setTranscript, characters, audioTime = 0 }: MainEditorProps) {
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const startEdit = (line: TranscriptLine) => {
    setEditingLineId(line.id)
    setEditingText(line.text)
  }

  const commitEdit = (id: string) => {
    setTranscript({
      ...transcript,
      lines: transcript.lines.map(l => (l.id === id ? { ...l, text: editingText.trim() } : l)),
    })
    setEditingLineId(null)
  }

  const cancelEdit = () => setEditingLineId(null)

  const deleteLine = (id: string) => {
    if (transcript.lines.length <= 1) return
    if (editingLineId === id) setEditingLineId(null)
    setTranscript({
      ...transcript,
      lines: transcript.lines.filter(l => l.id !== id),
    })
  }

  const insertLineAfter = (id: string) => {
    const currentLine = transcript.lines.find(l => l.id === id)
    if (!currentLine) return
    const newLine: TranscriptLine = {
      id: `new_${Date.now()}`,
      speaker: '',
      timestamp: null,
      text: '',
    }
    const idx = transcript.lines.findIndex(l => l.id === id)
    setTranscript({
      ...transcript,
      lines: [
        ...transcript.lines.slice(0, idx + 1).map(l => l.id === id ? { ...l, text: editingText } : l),
        newLine,
        ...transcript.lines.slice(idx + 1),
      ],
    })
    setEditingLineId(newLine.id)
    setEditingText('')
  }

  const setTimestamp = (id: string) => {
    setTranscript({
      ...transcript,
      lines: transcript.lines.map(l =>
        l.id === id ? { ...l, timestamp: fmtTime(audioTime) } : l
      ),
    })
  }

  const updateSpeaker = (id: string, speaker: string) => {
    setTranscript({
      ...transcript,
      lines: transcript.lines.map(l => (l.id === id ? { ...l, speaker } : l)),
    })
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto px-10 py-8">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-sm font-semibold text-slate-900">스크립트</h2>
            <span className="text-xs text-slate-400 font-mono">{transcript.date}</span>
          </div>

          {/* ── Transcript ── */}
          <div className="space-y-0.5">
            {transcript.lines.map(line => (
              <TranscriptRow
                key={line.id}
                line={line}
                isEditing={editingLineId === line.id}
                editingText={editingText}
                characters={characters}
                audioTime={audioTime}
                speakerColor={characters.find(c => c.name === line.speaker)?.color}
                onStartEdit={() => startEdit(line)}
                onCommit={() => commitEdit(line.id)}
                onEnter={() => insertLineAfter(line.id)}
                onCancel={cancelEdit}
                onTextChange={setEditingText}
                onSpeakerChange={speaker => updateSpeaker(line.id, speaker)}
                onStampTime={() => setTimestamp(line.id)}
                onDelete={() => deleteLine(line.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 단축키 힌트 바 ── */}
      <div className="shrink-0 h-8 border-t border-slate-100 bg-slate-50/60 flex items-center justify-center gap-5">
        <span className="text-[10px] text-slate-400">(인라인 편집시)</span>
        {[
          { key: 'Alt + Enter', label: '새 줄 삽입' },
          { key: 'Alt + S',     label: '저장' },
          { key: 'Esc',         label: '취소' },
        ].map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <kbd className="inline-flex items-center px-1 py-px rounded border border-slate-200 bg-white font-mono text-[10px] text-slate-500 leading-none">
              {key}
            </kbd>
            {label}
          </span>
        ))}
      </div>
    </main>
  )
}

/* ─── TranscriptRow ─── */

interface TranscriptRowProps {
  line: TranscriptLine
  isEditing: boolean
  editingText: string
  characters: Character[]
  audioTime: number
  speakerColor: string | undefined
  onStartEdit: () => void
  onCommit: () => void
  onEnter: () => void
  onCancel: () => void
  onTextChange: (text: string) => void
  onSpeakerChange: (speaker: string) => void
  onStampTime: () => void
  onDelete: () => void
}

function TranscriptRow({
  line,
  isEditing,
  editingText,
  characters,
  audioTime,
  speakerColor,
  onStartEdit,
  onCommit,
  onEnter,
  onCancel,
  onTextChange,
  onSpeakerChange,
  onStampTime,
  onDelete,
}: TranscriptRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    }
  }, [isEditing])

  // textarea 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current
    if (!el || !isEditing) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [editingText, isEditing])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.altKey) { e.preventDefault(); onEnter() }
    if (e.key === 's' && e.altKey) { e.preventDefault(); onCommit() }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  const rowBg = speakerColor ? speakerColor + '18' : undefined

  return (
    <div
      className={cn(
        'flex items-center gap-0 rounded-lg transition-colors group',
        isEditing ? 'ring-1 ring-slate-200' : '',
      )}
      style={{ backgroundColor: isEditing ? (rowBg ?? '#f8fafc') : rowBg }}
    >
      {/* 화자 드롭다운 — 항상 활성 */}
      <div className="w-24 shrink-0 px-2 py-1.5">
        <select
          value={line.speaker}
          onChange={e => onSpeakerChange(e.target.value)}
          className={cn(
            'w-full text-sm font-medium bg-transparent rounded-md',
            'border appearance-none cursor-pointer outline-none transition-colors px-1.5 py-0.5',
            'border-transparent hover:border-slate-200 hover:bg-white focus:border-slate-300 focus:bg-white',
            line.speaker === '' ? 'text-slate-400' : 'text-slate-800',
          )}
        >
          <option value="" disabled hidden>선택안함</option>
          <option value="">선택안함</option>
          {characters.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 타임스탬프 */}
      <div className="w-14 shrink-0 flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={e => { e.stopPropagation(); onStampTime() }}
              className={cn(
                'flex items-center gap-1 text-xs font-mono rounded px-1 py-0.5 transition-colors',
                line.timestamp
                  ? 'text-blue-400 hover:bg-blue-50 hover:text-blue-600'
                  : 'text-slate-400 hover:text-blue-400 hover:bg-blue-50',
              )}
            >
              {line.timestamp ?? '--:--'}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {line.timestamp
              ? `${fmtTime(audioTime)}으로 변경`
              : `${fmtTime(audioTime)} 스탬프 추가`}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 텍스트 영역 */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editingText}
          onChange={e => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="내용을 입력하세요"
          className={cn(
            'flex-1 my-1 py-1.5 px-3 text-sm text-slate-900 leading-relaxed resize-none overflow-hidden',
            'rounded-md border border-slate-200 bg-white outline-none',
            'focus:ring-1 focus:ring-slate-300',
            'placeholder:text-slate-300',
          )}
        />
      ) : (
        <span
          onClick={onStartEdit}
          className={cn(
            'flex-1 text-sm leading-relaxed whitespace-pre-wrap',
            'py-1.5 cursor-text select-text',
            'rounded-md transition-colors',
            line.text
              ? 'text-slate-700 group-hover:text-slate-900'
              : 'text-slate-300 italic',
          )}
        >
          {line.text || '내용을 입력하세요'}
        </span>
      )}

      {/* 저장 버튼 (편집 중) / 삭제 버튼 (편집 아닐 때) */}
      {isEditing ? (
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={onCommit}
          className="w-7 h-7 ml-1 mr-1 shrink-0 flex items-center justify-center rounded-md text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className={cn(
            'w-7 h-7 ml-1 mr-1 shrink-0 flex items-center justify-center rounded-md transition-colors',
            'text-slate-200 hover:text-red-400 hover:bg-red-50',
            'opacity-0 group-hover:opacity-100',
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
