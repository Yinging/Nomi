/**
 * 卡片渲染共用 helpers + 子组件。
 *
 * 4 张卡片（角色/场景/道具/声音）共享：
 * - 占位斜条纹背景
 * - 关联计数 dot
 * - 变体 chip
 * - 数据缺失时隐藏对应行（spec §3.4 Level 0）
 */
import React from 'react'
import { cn } from '../../../../utils/cn'

export const STRIPED_BG_CLASS =
  'bg-[repeating-linear-gradient(45deg,var(--nomi-ink-05)_0_10px,var(--nomi-ink-10)_10px_20px)]'

export function UsageDot({ count }: { count: number }): JSX.Element | null {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-nomi-accent" aria-hidden />
      <span className="text-[11px] text-nomi-ink-60 tabular-nums">{count}</span>
    </span>
  )
}

export function VariantChip({ count }: { count: number }): JSX.Element | null {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full',
        'bg-nomi-ink-05 text-nomi-ink-60',
        'text-[11px] px-2 py-[1px] tabular-nums',
      )}
    >
      ⊕{count}变体
    </span>
  )
}

export function PlaceholderCenter({ label }: { label: string }): JSX.Element {
  return (
    <div className={cn('flex flex-col items-center justify-center w-full h-full gap-1 pointer-events-none')}>
      <span className="text-[13px] font-medium text-nomi-ink-60 tabular-nums">{label}</span>
      <span className="text-[11px] text-nomi-ink-40">等待生成</span>
    </div>
  )
}

/**
 * 取节点的"placeholder 标签"
 * shots → "分镜 NN"（由 BaseGenerationNode 接管，不走这里）
 * 其它 → 分类名 / fallback title
 */
export function placeholderLabel(categoryName: string | undefined, title: string | undefined): string {
  return categoryName || title || '节点'
}
