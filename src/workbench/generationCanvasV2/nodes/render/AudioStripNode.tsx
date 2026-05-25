/**
 * AudioStripNode body — 声音分类节点（spec §4.4）。
 *
 * 视觉：420×80 固定，无图，水平条带布局：
 * [播放按钮] [类型徽标] [名字] [波形] [时长] [使用计数]
 *
 * v0.7 不做真实播放 / 波形分析（需要 audio kind 落地）。
 * 当前显示骨架 + meta 里的 audioKind / durationSec 优雅渲染。
 */
import React from 'react'
import { IconPlayerPlay } from '@tabler/icons-react'
import { cn } from '../../../../utils/cn'
import type { GenerationCanvasNode } from '../../model/generationCanvasTypes'
import { readAudioMeta, AUDIO_KIND_LABELS } from '../../model/nodeMetaFields'
import { useNodeUsageCount } from '../../hooks/useNodeRelationships'
import { UsageDot } from './CardCommon'

type Props = {
  node: GenerationCanvasNode
}

function formatDuration(seconds: number | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function WaveformPlaceholder(): JSX.Element {
  // 静态 SVG 波形占位，v0.7 不做真实分析
  const bars = [0.4, 0.7, 0.5, 0.9, 0.3, 0.8, 0.6, 0.7, 0.4, 0.8, 0.5, 0.6, 0.7, 0.4, 0.9, 0.5]
  return (
    <svg viewBox="0 0 160 32" preserveAspectRatio="none" className="h-8 flex-1 opacity-30">
      {bars.map((h, i) => {
        const barH = h * 28
        const y = (32 - barH) / 2
        return (
          <rect
            key={i}
            x={i * 10}
            y={y}
            width="6"
            height={barH}
            rx="2"
            fill="currentColor"
          />
        )
      })}
    </svg>
  )
}

export default function AudioStripNode({ node }: Props): JSX.Element {
  const meta = readAudioMeta(node)
  const usageCount = useNodeUsageCount(node.id, node.title)
  const audioKindLabel = meta.audioKind ? AUDIO_KIND_LABELS[meta.audioKind] : null

  return (
    <div
      className={cn(
        'w-full h-full rounded-nomi-lg bg-nomi-paper',
        'flex items-center gap-3 px-3',
      )}
    >
      {/* 播放按钮 — disabled in v0.7 (no real audio) */}
      <button
        type="button"
        className={cn(
          'inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-full',
          'bg-nomi-ink text-nomi-paper',
          'opacity-50 cursor-not-allowed',
        )}
        aria-label="播放（暂不可用）"
        title="播放（待 audio kind 上线）"
        disabled
        onPointerDown={(event) => event.stopPropagation()}
      >
        <IconPlayerPlay size={14} stroke={1.8} aria-hidden />
      </button>

      {/* 类型徽标 + 名字 */}
      <div className="flex flex-col gap-1 min-w-0 shrink-0 max-w-[140px]">
        {audioKindLabel ? (
          <span
            className={cn(
              'inline-flex w-fit rounded-full px-2 py-[1px]',
              'bg-nomi-accent-soft text-nomi-accent',
              'text-[10px] font-medium',
            )}
          >
            {audioKindLabel}
          </span>
        ) : null}
        <span className="text-[14px] text-nomi-ink truncate" title={node.title}>
          {node.title || '未命名'}
        </span>
      </div>

      {/* 波形 */}
      <div className="flex-1 min-w-0 text-nomi-ink-40">
        <WaveformPlaceholder />
      </div>

      {/* 时长 + 计数 */}
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span className="text-[12px] text-nomi-ink-60 tabular-nums font-mono">
          {formatDuration(meta.durationSec)}
        </span>
        <UsageDot count={usageCount} />
      </div>
    </div>
  )
}
