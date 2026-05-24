import React from 'react'
import { cn } from '../../utils/cn'
import { BUILTIN_CATEGORIES, type ProjectCategory } from '../project/projectCategories'
import { useWorkbenchStore } from '../workbenchStore'
import { useGenerationCanvasStore } from '../generationCanvasV2/store/generationCanvasStore'
import CategoryItem from './CategoryItem'

type Props = {
  categories?: ProjectCategory[]
}

export default function CategorySidebar({ categories }: Props): JSX.Element {
  const collapsed = useWorkbenchStore((s) => s.sidebarCollapsed)
  const toggle = useWorkbenchStore((s) => s.toggleSidebarCollapsed)
  const activeCategoryId = useWorkbenchStore((s) => s.activeCategoryId)
  const setActiveCategoryId = useWorkbenchStore((s) => s.setActiveCategoryId)
  const nodes = useGenerationCanvasStore((s) => s.nodes)
  const reassignCategory = useGenerationCanvasStore((s) => s.reassignNodeCategory)

  const visible = React.useMemo(() => {
    const list = (categories && categories.length ? categories : BUILTIN_CATEGORIES)
      .filter((c) => !c.isHidden)
      .slice()
      .sort((a, b) => a.order - b.order)
    return list
  }, [categories])

  const counts = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const node of nodes) {
      const id = node.categoryId || 'shots'
      map.set(id, (map.get(id) || 0) + 1)
    }
    return map
  }, [nodes])

  return (
    <aside
      data-collapsed={collapsed ? 'true' : 'false'}
      className={cn(
        'flex flex-col h-full min-h-0 border-r border-nomi-line bg-nomi-paper',
        'transition-[width] duration-150 ease-out',
        collapsed ? 'w-[60px]' : 'w-[200px]',
      )}
      aria-label="项目分类"
    >
      <div className={cn('flex items-center px-2 py-2 border-b border-nomi-line', collapsed ? 'justify-center' : 'justify-between')}>
        {collapsed ? null : (
          <span className="text-[11px] uppercase tracking-wider text-nomi-ink-40">分类</span>
        )}
        <button
          type="button"
          onClick={toggle}
          className="text-nomi-ink-40 hover:text-nomi-ink p-1 rounded text-[12px]"
          aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
        {visible.map((cat) => (
          <CategoryItem
            key={cat.id}
            category={cat}
            count={counts.get(cat.id) || 0}
            active={activeCategoryId === cat.id}
            collapsed={collapsed}
            onActivate={() => setActiveCategoryId(cat.id)}
            onDropNode={(nodeId) => reassignCategory(nodeId, cat.id)}
          />
        ))}
      </nav>
      <div className={cn('px-2 py-2 border-t border-nomi-line', collapsed && 'hidden')}>
        <button
          type="button"
          disabled
          className={cn(
            'w-full px-2 py-1.5 text-[12px] rounded-md border border-dashed border-nomi-line',
            'text-nomi-ink-40 cursor-not-allowed',
          )}
          title="自定义分类将在 Phase F 落地"
        >
          + 新分类
        </button>
      </div>
    </aside>
  )
}
