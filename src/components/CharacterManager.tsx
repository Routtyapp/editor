import { useState, useRef } from 'react'
import { Plus, Pencil, X, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Character } from '@/types'

const PALETTE = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#F97316', '#6366F1',
  '#EC4899', '#14B8A6', '#84CC16', '#A855F7',
]

interface CharacterManagerProps {
  characters: Character[]
  setCharacters: (chars: Character[]) => void
}

export default function CharacterManager({ characters, setCharacters }: CharacterManagerProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [swatchOpenId, setSwatchOpenId] = useState<string | null>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  const nextColor = () => PALETTE[characters.length % PALETTE.length]

  const addCharacter = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setCharacters([...characters, { id: `new_speaker_${Date.now()}`, name: trimmed, color: nextColor() }])
    setNewName('')
    newInputRef.current?.focus()
  }

  const startEditing = (char: Character) => {
    setEditingId(char.id)
    setEditingName(char.name)
    setSwatchOpenId(null)
  }

  const saveEditing = () => {
    const trimmed = editingName.trim()
    if (!trimmed || !editingId) return
    setCharacters(characters.map(c => (c.id === editingId ? { ...c, name: trimmed } : c)))
    setEditingId(null)
  }

  const cancelEditing = () => setEditingId(null)

  const deleteCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id))
  }

  const setColor = (id: string, color: string) => {
    setCharacters(characters.map(c => (c.id === id ? { ...c, color } : c)))
    setSwatchOpenId(null)
  }

  return (
    <div className="space-y-1">
      {characters.length === 0 && (
        <p className="text-xs text-slate-400 py-4 text-center">등장인물을 추가해주세요</p>
      )}

      {characters.map(char => (
        <div key={char.id} className="relative">
          <div className="flex items-center gap-1 h-9 px-1 rounded-lg hover:bg-slate-100 group transition-colors">
            {editingId === char.id ? (
              <>
                <Input
                  autoFocus
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEditing()
                    if (e.key === 'Escape') cancelEditing()
                  }}
                  className="flex-1 h-7 text-sm border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
                />
                <Button variant="ghost" size="icon" onClick={saveEditing}
                  className="w-7 h-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={cancelEditing}
                  className="w-7 h-7 text-slate-400 hover:text-slate-600 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                {/* 색 스와치 버튼 */}
                <button
                  onClick={() => setSwatchOpenId(swatchOpenId === char.id ? null : char.id)}
                  className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white ring-offset-1 hover:scale-110 transition-transform"
                  style={{ backgroundColor: char.color }}
                />
                <span className="flex-1 text-sm text-slate-700 px-1.5">{char.name}</span>
                <Button variant="ghost" size="icon" onClick={() => startEditing(char)}
                  className={cn('w-7 h-7 text-slate-300 hover:text-slate-600 shrink-0', 'opacity-0 group-hover:opacity-100 transition-opacity')}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteCharacter(char.id)}
                  className={cn('w-7 h-7 text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0', 'opacity-0 group-hover:opacity-100 transition-opacity')}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>

          {/* 색 팔레트 팝업 */}
          {swatchOpenId === char.id && (
            <div className="absolute left-0 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 grid grid-cols-6 gap-1.5">
              {PALETTE.map(color => (
                <button
                  key={color}
                  onClick={() => setColor(char.id, color)}
                  className={cn(
                    'w-5 h-5 rounded-full hover:scale-110 transition-transform',
                    char.color === color && 'ring-2 ring-offset-1 ring-slate-400',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 추가 입력 */}
      <div className="flex gap-2 pt-2">
        <Input
          ref={newInputRef}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCharacter() }}
          placeholder="이름 입력"
          className="flex-1 h-8 text-sm placeholder:text-slate-300 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
        />
        <Button variant="outline" size="sm" onClick={addCharacter} disabled={!newName.trim()}
          className="h-8 px-3 text-slate-600 border-slate-200 shrink-0">
          <Plus className="w-3.5 h-3.5 mr-1" />
          추가
        </Button>
      </div>
    </div>
  )
}
