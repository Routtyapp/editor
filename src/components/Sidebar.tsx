import { Button } from '@/components/ui/button'
import AudioPlayer from './AudioPlayer'
import CharacterManager from './CharacterManager'
import type { Character } from '@/types'

interface SidebarProps {
  characters: Character[]
  setCharacters: (chars: Character[]) => void
  audioSrc?: string
  onAudioTimeChange?: (time: number) => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="h-px bg-slate-200 shrink-0" />
}

export default function Sidebar({ characters, setCharacters, audioSrc, onAudioTimeChange }: SidebarProps) {
  return (
    <aside className="w-80 border-l border-slate-200 flex flex-col shrink-0 bg-slate-50/30">

      {/* ① 오디오 */}
      <div className="px-5 pt-5 pb-5 shrink-0">
        <SectionLabel>오디오</SectionLabel>
        <AudioPlayer src={audioSrc} onTimeChange={onAudioTimeChange} />
      </div>

      <Divider />

      {/* ② 등장인물 */}
      <div className="flex-1 min-h-0 flex flex-col px-5 pt-4 pb-3 overflow-hidden">
        <SectionLabel>등장인물</SectionLabel>
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          <CharacterManager characters={characters} setCharacters={setCharacters} />
        </div>
      </div>

      <Divider />

      {/* ③ 완료 */}
      <div className="px-5 py-4 shrink-0">
        <Button className="w-full h-10 text-sm font-medium" onClick={() => {}}>
          완료
        </Button>
      </div>
    </aside>
  )
}
