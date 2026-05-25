/**
 * 节点关联计数 hooks。
 *
 * Live 计算的关联度量（spec §5.3）：
 * - useNodeUsageCount: 该节点在多少分镜里被引用（文本匹配 prompt）
 * - useNodeVariantCount: 该节点的变体数（derivedFrom + regeneratedFrom 反查）
 *
 * MVP 用文本匹配；Phase G 关系图谱接入后改为精确引用计数。
 */
import { useGenerationCanvasStore } from '../store/generationCanvasStore'

/**
 * 当前节点的"使用次数"：在所有 shots 分类节点的 prompt 中，
 * 包含本节点 title 字符串的数量。
 *
 * 排除自身（避免 shots 自身 prompt 含 title 时自计）。
 */
export function useNodeUsageCount(nodeId: string, nodeTitle: string | undefined): number {
  return useGenerationCanvasStore((state) => {
    if (!nodeTitle || !nodeTitle.trim()) return 0
    return state.nodes.filter((n) =>
      n.categoryId === 'shots' &&
      n.id !== nodeId &&
      typeof n.prompt === 'string' &&
      n.prompt.includes(nodeTitle),
    ).length
  })
}

/**
 * 当前节点的"变体数"：直接派生自本节点的副本/重生成数。
 * 不递归（V1 → V2 → V3 中，对 V1 来说 variants=1 仅算 V2 不包括 V3）。
 */
export function useNodeVariantCount(nodeId: string): number {
  return useGenerationCanvasStore((state) =>
    state.nodes.filter((n) => n.derivedFrom === nodeId || n.regeneratedFrom === nodeId).length,
  )
}
