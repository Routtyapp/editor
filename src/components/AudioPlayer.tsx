import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, RotateCw, Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  src?: string
  onTimeChange?: (time: number) => void
}

export default function AudioPlayer({ src, onTimeChange }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !isLoaded) return
    if (audio.paused) { audio.play(); setIsPlaying(true) }
    else              { audio.pause(); setIsPlaying(false) }
  }, [isLoaded])

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio || !isLoaded) return
    audio.currentTime = Math.max(0, audio.currentTime + seconds)
  }, [isLoaded])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      if (isTyping) return
      if (e.code === 'Space')       { e.preventDefault(); togglePlay() }
      else if (e.code === 'ArrowLeft')  { e.preventDefault(); skip(-3) }
      else if (e.code === 'ArrowRight') { e.preventDefault(); skip(3) }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skip])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-4">

      {/* 파일 정보 */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Music2 className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs font-medium truncate', isLoaded ? 'text-slate-700' : 'text-slate-400')}>
            {src ? src.split('/').pop() : (isLoaded ? '오디오 파일' : 'DB 연동 대기 중')}
          </p>
          {!src && !isLoaded && (
            <p className="text-[10px] text-slate-300 mt-0.5">GET 요청으로 불러올 예정</p>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          const t = audioRef.current?.currentTime ?? 0
          setCurrentTime(t)
          onTimeChange?.(t)
        }}
        onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setIsLoaded(true) }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="relative h-1.5">
          <div className="absolute inset-0 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-slate-600 rounded-full transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={e => {
              if (!audioRef.current || !isLoaded) return
              const val = Number(e.target.value)
              audioRef.current.currentTime = val
              setCurrentTime(val)
            }}
            className={cn(
              'absolute inset-0 w-full h-full opacity-0',
              isLoaded ? 'cursor-pointer' : 'cursor-default',
            )}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls — 항상 full opacity, isLoaded 내부에서 guard */}
      <div className="flex items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-3)}
              aria-disabled={!isLoaded}
              className={cn(
                'w-9 h-9 flex flex-col items-center gap-0',
                isLoaded ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 cursor-default',
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[9px] font-mono leading-none mt-0.5">3s</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            3초 뒤로 <kbd className="ml-1 font-mono bg-slate-100 px-1 rounded text-[10px]">←</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={togglePlay}
              aria-disabled={!isLoaded}
              className={cn(
                'w-10 h-10 rounded-full transition-colors',
                isLoaded
                  ? 'bg-slate-900 hover:bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-default hover:bg-slate-200',
              )}
            >
              {isPlaying
                ? <Pause className="w-4 h-4" />
                : <Play className="w-4 h-4 ml-0.5" />
              }
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {isPlaying ? '일시정지' : '재생'}{' '}
            <kbd className="ml-1 font-mono bg-slate-100 px-1 rounded text-[10px]">Space</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(3)}
              aria-disabled={!isLoaded}
              className={cn(
                'w-9 h-9 flex flex-col items-center gap-0',
                isLoaded ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 cursor-default',
              )}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="text-[9px] font-mono leading-none mt-0.5">3s</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            3초 앞으로 <kbd className="ml-1 font-mono bg-slate-100 px-1 rounded text-[10px]">→</kbd>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-slate-300">
        <span>
          <kbd className="font-mono bg-slate-100 text-slate-400 px-1 py-px rounded">Space</kbd>{' '}재생/정지
        </span>
        <span>
          <kbd className="font-mono bg-slate-100 text-slate-400 px-1 py-px rounded">← →</kbd>{' '}3초
        </span>
      </div>
    </div>
  )
}
