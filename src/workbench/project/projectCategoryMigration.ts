import type {
  GenerationCanvasEdge,
  GenerationCanvasNode,
  GenerationCanvasSnapshot,
} from '../generationCanvasV2/model/generationCanvasTypes'
import type { WorkbenchProjectPayload, WorkbenchProjectRecordV1 } from './projectRecordSchema'
import { cloneBuiltinCategories } from './projectCategories'

/**
 * Phase E4: auto-migration of legacy v0.4 projects into the directory-tree
 * model. A project is "migrated" when every node has a `categoryId` AND the
 * payload carries a non-empty `categories` array. The migration is idempotent
 * — running it twice on the same project is a no-op.
 *
 * Heuristic mapping by node kind:
 *  - text                  → story
 *  - character             → characters
 *  - scene / panorama      → scenes
 *  - image / video         → shots (if part of a temporal edge), else inbox
 *  - output                → exports
 *  - (everything else)     → inbox
 */

export type CategoryMigrationDiagnostic = {
  projectId?: string
  totalNodes: number
  migratedNodes: number
  categoriesSeeded: boolean
  alreadyMigrated: boolean
}

function isLikelyShot(node: GenerationCanvasNode, edges: readonly GenerationCanvasEdge[]): boolean {
  return edges.some((edge) => edge.source === node.id || edge.target === node.id)
}

export function migrateNodeToCategoryId(
  node: GenerationCanvasNode,
  edges: readonly GenerationCanvasEdge[],
): string {
  if (node.categoryId) return node.categoryId
  const kind = node.kind
  if (kind === 'text') return 'story'
  if (kind === 'character') return 'characters'
  if (kind === 'scene' || kind === 'panorama') return 'scenes'
  if (kind === 'image' || kind === 'video') {
    return isLikelyShot(node, edges) ? 'shots' : 'inbox'
  }
  if (kind === 'output') return 'exports'
  return 'inbox'
}

export function migrateGenerationCanvasSnapshot(
  snapshot: GenerationCanvasSnapshot,
): { snapshot: GenerationCanvasSnapshot; migratedCount: number } {
  let migratedCount = 0
  const nextNodes = snapshot.nodes.map((node) => {
    if (node.categoryId) return node
    migratedCount += 1
    return {
      ...node,
      categoryId: migrateNodeToCategoryId(node, snapshot.edges),
    }
  })
  if (!migratedCount) return { snapshot, migratedCount: 0 }
  return {
    snapshot: { ...snapshot, nodes: nextNodes },
    migratedCount,
  }
}

export function migrateProjectPayload(payload: WorkbenchProjectPayload): {
  payload: WorkbenchProjectPayload
  diagnostic: CategoryMigrationDiagnostic
} {
  const hasCategories = Array.isArray(payload.categories) && payload.categories.length > 0
  const nodeMigration = migrateGenerationCanvasSnapshot(payload.generationCanvas)
  const totalNodes = payload.generationCanvas.nodes.length
  const alreadyMigrated = hasCategories && nodeMigration.migratedCount === 0
  if (alreadyMigrated) {
    return {
      payload,
      diagnostic: {
        totalNodes,
        migratedNodes: 0,
        categoriesSeeded: false,
        alreadyMigrated: true,
      },
    }
  }
  const categoriesSeeded = !hasCategories
  return {
    payload: {
      ...payload,
      ...(categoriesSeeded ? { categories: cloneBuiltinCategories() } : {}),
      generationCanvas: nodeMigration.snapshot,
    },
    diagnostic: {
      totalNodes,
      migratedNodes: nodeMigration.migratedCount,
      categoriesSeeded,
      alreadyMigrated: false,
    },
  }
}

export function migrateProjectRecord(record: WorkbenchProjectRecordV1): {
  record: WorkbenchProjectRecordV1
  diagnostic: CategoryMigrationDiagnostic
} {
  const { payload, diagnostic } = migrateProjectPayload(record.payload)
  if (diagnostic.alreadyMigrated) return { record, diagnostic }
  return {
    record: { ...record, payload },
    diagnostic: { ...diagnostic, projectId: record.id },
  }
}
