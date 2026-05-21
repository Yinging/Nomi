import React from 'react'
import {
  IconCopy,
  IconCut,
  IconPlus,
} from '@tabler/icons-react'
import { WorkbenchButton } from '../../../design'
import { cn } from '../../../utils/cn'
import type { GenerationNodeKind } from '../model/generationCanvasTypes'
import { getGenerationNodePlugin, getQuickAddGenerationNodePlugins } from '../nodes/renderRegistry'
import { useGenerationCanvasStore } from '../store/generationCanvasStore'

const QUICK_ADD_NODE_ITEMS = getQuickAddGenerationNodePlugins()

function NodePluginIcon({ kind, size }: { kind: GenerationNodeKind; size: number }): JSX.Element {
  const Icon = getGenerationNodePlugin(kind).icon
  return <Icon size={size} />
}

type CanvasToolbarProps = {
  getInsertionPosition: () => { x: number; y: number }
}

type NodeAddMenuProps = {
  className?: string
  style?: React.CSSProperties
  onAddNode: (kind: GenerationNodeKind) => void
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>
}

export function NodeAddMenu({
  className,
  style,
  onAddNode,
  onContextMenu,
  onPointerDown,
}: NodeAddMenuProps): JSX.Element {
  return (
    <div
      className={cn(
        'generation-canvas-v2-toolbar__node-menu',
        'absolute top-0 left-[calc(100%+8px)] grid gap-1 w-[132px] p-[6px]',
        'border border-workbench-border rounded-[12px]',
        'bg-white/[0.96] shadow-workbench-pop',
        className,
      )}
      role="menu"
      aria-label="添加节点菜单"
      style={style}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
    >
      {QUICK_ADD_NODE_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <WorkbenchButton
            key={item.kind}
            className={cn(
              'inline-flex items-center justify-start gap-[6px]',
              'w-full h-8 min-h-8 px-2 border-0 rounded-[8px]',
              'bg-workbench-surface-solid text-workbench-ink font-[inherit] text-xs cursor-pointer',
              'hover:bg-nomi-ink-05',
            )}
            role="menuitem"
            aria-label={`添加${item.menuLabel}节点`}
            onClick={() => onAddNode(item.kind)}
          >
            <Icon size={15} />
            <span>{item.menuLabel}</span>
          </WorkbenchButton>
        )
      })}
    </div>
  )
}

export default function CanvasToolbar({ getInsertionPosition }: CanvasToolbarProps): JSX.Element {
  const addNode = useGenerationCanvasStore((state) => state.addNode)
  const selectedNodeIds = useGenerationCanvasStore((state) => state.selectedNodeIds)
  const copySelectedNodes = useGenerationCanvasStore((state) => state.copySelectedNodes)
  const cutSelectedNodes = useGenerationCanvasStore((state) => state.cutSelectedNodes)
  const pendingConnectionSourceId = useGenerationCanvasStore((state) => state.pendingConnectionSourceId)
  const [nodeMenuOpen, setNodeMenuOpen] = React.useState(false)

  const handleAddNode = (kind: GenerationNodeKind) => {
    addNode({ kind, position: getInsertionPosition() })
    setNodeMenuOpen(false)
  }

  return (
    <div
      className={cn(
        'generation-canvas-v2-toolbar',
        'absolute top-1/2 left-4 z-[8] inline-flex flex-col items-center gap-1 p-[6px]',
        'border border-workbench-border rounded-nomi',
        'bg-nomi-paper shadow-workbench-md -translate-y-1/2',
      )}
      aria-label="生成画布工具栏"
    >
      <WorkbenchButton
        className={cn(
          'w-8 h-8 min-h-8 p-0 border-0 rounded-nomi-sm cursor-pointer',
          'data-[primary=true]:bg-nomi-ink data-[primary=true]:text-nomi-paper',
        )}
        aria-label="添加节点"
        title="添加节点"
        data-primary="true"
        onClick={() => setNodeMenuOpen((open) => !open)}
      >
        <IconPlus size={17} />
        <span className="hidden">添加</span>
      </WorkbenchButton>
      {nodeMenuOpen ? <NodeAddMenu onAddNode={handleAddNode} /> : null}
      <span className={cn('w-5 h-px bg-workbench-border')} />
      <WorkbenchButton
        className={cn('w-8 h-8 min-h-8 p-0 border-0 rounded-nomi-sm cursor-pointer')}
        aria-label="添加文本节点"
        title="文本"
        onClick={() => handleAddNode('text')}
      >
        <NodePluginIcon kind="text" size={15} />
        <span className="hidden">文本</span>
      </WorkbenchButton>
      <WorkbenchButton
        className={cn('w-8 h-8 min-h-8 p-0 border-0 rounded-nomi-sm cursor-pointer')}
        aria-label="添加图片节点"
        title="图像"
        onClick={() => handleAddNode('image')}
      >
        <NodePluginIcon kind="image" size={15} />
        <span className="hidden">图像</span>
      </WorkbenchButton>
      <WorkbenchButton
        className={cn('w-8 h-8 min-h-8 p-0 border-0 rounded-nomi-sm cursor-pointer')}
        aria-label="添加视频节点"
        title="视频"
        onClick={() => handleAddNode('video')}
      >
        <NodePluginIcon kind="video" size={15} />
        <span className="hidden">视频</span>
      </WorkbenchButton>
      <span className={cn('w-5 h-px bg-workbench-border')} />
      <span className={cn('hidden', pendingConnectionSourceId && 'text-workbench-accent')}>
        {pendingConnectionSourceId ? '选择目标节点' : '拖拽空白区域平移'}
      </span>
      <WorkbenchButton
        className={cn('w-8 h-8 min-h-8 p-0 border-0 rounded-nomi-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-[0.42]')}
        aria-label="复制选中节点"
        title="复制选中节点"
        disabled={selectedNodeIds.length === 0}
        onClick={copySelectedNodes}
      >
        <IconCopy size={15} />
        <span className="hidden">复制</span>
      </WorkbenchButton>
      <WorkbenchButton
        className={cn('w-8 h-8 min-h-8 p-0 border-0 rounded-nomi-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-[0.42]')}
        aria-label="剪切选中节点"
        title="剪切选中节点"
        disabled={selectedNodeIds.length === 0}
        onClick={cutSelectedNodes}
      >
        <IconCut size={15} />
        <span className="hidden">剪切</span>
      </WorkbenchButton>
    </div>
  )
}
