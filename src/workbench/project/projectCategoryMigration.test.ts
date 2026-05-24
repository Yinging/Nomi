import { describe, expect, it } from 'vitest'
import { migrateNodeToCategoryId, migrateGenerationCanvasSnapshot } from './projectCategoryMigration'
import type { GenerationCanvasNode, GenerationCanvasEdge, GenerationNodeKind } from '../generationCanvasV2/model/generationCanvasTypes'

function makeNode(overrides: Partial<GenerationCanvasNode> & { kind: GenerationNodeKind; id?: string }): GenerationCanvasNode {
  return {
    id: overrides.id || 'n1',
    kind: overrides.kind,
    title: overrides.title || 'Node',
    position: overrides.position || { x: 0, y: 0 },
    size: overrides.size,
    prompt: overrides.prompt,
    references: overrides.references,
    result: overrides.result,
    history: overrides.history,
    progress: overrides.progress,
    runs: overrides.runs,
    status: overrides.status,
    error: overrides.error,
    meta: overrides.meta,
    categoryId: overrides.categoryId,
  } as GenerationCanvasNode
}

describe('migrateNodeToCategoryId', () => {
  it('keeps explicit categoryId untouched', () => {
    const node = makeNode({ kind: 'image', categoryId: 'inbox' })
    expect(migrateNodeToCategoryId(node, [])).toBe('inbox')
  })

  it('text → story', () => {
    expect(migrateNodeToCategoryId(makeNode({ kind: 'text' }), [])).toBe('story')
  })

  it('character → characters', () => {
    expect(migrateNodeToCategoryId(makeNode({ kind: 'character' }), [])).toBe('characters')
  })

  it('scene → scenes', () => {
    expect(migrateNodeToCategoryId(makeNode({ kind: 'scene' }), [])).toBe('scenes')
  })

  it('panorama → scenes', () => {
    expect(migrateNodeToCategoryId(makeNode({ kind: 'panorama' }), [])).toBe('scenes')
  })

  it('output → exports', () => {
    expect(migrateNodeToCategoryId(makeNode({ kind: 'output' }), [])).toBe('exports')
  })

  it('image without edges → inbox', () => {
    const node = makeNode({ kind: 'image', id: 'img1' })
    expect(migrateNodeToCategoryId(node, [])).toBe('inbox')
  })

  it('image with reference edge → shots', () => {
    const n1 = makeNode({ kind: 'image', id: 'img1' })
    const edges: GenerationCanvasEdge[] = [
      { id: 'e1', source: 'img1', target: 'img2' },
    ]
    expect(migrateNodeToCategoryId(n1, edges)).toBe('shots')
  })

  it('unknown kind → inbox fallback', () => {
    const node = makeNode({ kind: 'shot' as GenerationNodeKind })
    expect(migrateNodeToCategoryId(node, [])).toBe('inbox')
  })
})

describe('migrateGenerationCanvasSnapshot', () => {
  it('migrates only nodes without categoryId', () => {
    const snapshot = {
      nodes: [
        makeNode({ kind: 'text', id: 'a' }),
        makeNode({ kind: 'character', id: 'b', categoryId: 'characters' }),
        makeNode({ kind: 'image', id: 'c' }),
      ],
      edges: [],
      selectedNodeIds: [],
    }
    const { snapshot: next, migratedCount } = migrateGenerationCanvasSnapshot(snapshot)
    expect(migratedCount).toBe(2)
    expect(next.nodes.find((n) => n.id === 'a')?.categoryId).toBe('story')
    expect(next.nodes.find((n) => n.id === 'b')?.categoryId).toBe('characters')
    expect(next.nodes.find((n) => n.id === 'c')?.categoryId).toBe('inbox')
  })

  it('is idempotent on already-migrated snapshot', () => {
    const snapshot = {
      nodes: [makeNode({ kind: 'text', id: 'a', categoryId: 'story' })],
      edges: [],
      selectedNodeIds: [],
    }
    const { migratedCount } = migrateGenerationCanvasSnapshot(snapshot)
    expect(migratedCount).toBe(0)
  })
})
