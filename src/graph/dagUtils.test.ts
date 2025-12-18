/**
 * Tests for DAG traversal utilities.
 */
import { describe, it, expect } from 'vitest';
import {
  createNodeMap,
  getDirectDependencies,
  getTransitiveDependencies,
  getAllDependencies,
  getAllAncestors,
  topologicalSort,
} from './dagUtils';
import type { FormNode } from '../shared/types';

// Test fixtures
const createMockNode = (
  id: string,
  name: string,
  prerequisites: string[] = []
): FormNode => ({
  id,
  type: 'form',
  position: { x: 0, y: 0 },
  data: {
    id: `data-${id}`,
    component_key: id,
    component_type: 'form',
    component_id: `form-def-${id}`,
    name,
    prerequisites,
    permitted_roles: [],
    input_mapping: {},
    sla_duration: { number: 0, unit: 'minutes' },
    approval_required: false,
    approval_roles: [],
  },
});

// Create a test DAG structure:
// A -> B -> D
// A -> C -> E
// D -> F
// E -> F
// (Form F depends on both D and E)
const nodeA = createMockNode('node-a', 'Form A', []);
const nodeB = createMockNode('node-b', 'Form B', ['node-a']);
const nodeC = createMockNode('node-c', 'Form C', ['node-a']);
const nodeD = createMockNode('node-d', 'Form D', ['node-b']);
const nodeE = createMockNode('node-e', 'Form E', ['node-c']);
const nodeF = createMockNode('node-f', 'Form F', ['node-d', 'node-e']);

const allNodes = [nodeA, nodeB, nodeC, nodeD, nodeE, nodeF];

describe('createNodeMap', () => {
  it('creates a map with all nodes indexed by id', () => {
    const nodeMap = createNodeMap(allNodes);
    
    expect(nodeMap.size).toBe(6);
    expect(nodeMap.get('node-a')).toBe(nodeA);
    expect(nodeMap.get('node-f')).toBe(nodeF);
  });

  it('handles empty array', () => {
    const nodeMap = createNodeMap([]);
    expect(nodeMap.size).toBe(0);
  });
});

describe('getDirectDependencies', () => {
  it('returns empty array for root nodes', () => {
    const nodeMap = createNodeMap(allNodes);
    const deps = getDirectDependencies(nodeA, nodeMap);
    
    expect(deps).toHaveLength(0);
  });

  it('returns direct prerequisites', () => {
    const nodeMap = createNodeMap(allNodes);
    const deps = getDirectDependencies(nodeB, nodeMap);
    
    expect(deps).toHaveLength(1);
    expect(deps[0].id).toBe('node-a');
  });

  it('returns multiple direct prerequisites', () => {
    const nodeMap = createNodeMap(allNodes);
    const deps = getDirectDependencies(nodeF, nodeMap);
    
    expect(deps).toHaveLength(2);
    expect(deps.map((n) => n.id)).toContain('node-d');
    expect(deps.map((n) => n.id)).toContain('node-e');
  });
});

describe('getTransitiveDependencies', () => {
  it('returns empty array for root nodes', () => {
    const nodeMap = createNodeMap(allNodes);
    const deps = getTransitiveDependencies(nodeA, nodeMap);
    
    expect(deps).toHaveLength(0);
  });

  it('returns empty array for nodes with only direct dependencies', () => {
    const nodeMap = createNodeMap(allNodes);
    const deps = getTransitiveDependencies(nodeB, nodeMap);
    
    // Node B only has A as direct, no transitive
    expect(deps).toHaveLength(0);
  });

  it('returns transitive dependencies', () => {
    const nodeMap = createNodeMap(allNodes);
    const deps = getTransitiveDependencies(nodeD, nodeMap);
    
    // Node D has B as direct and A as transitive
    expect(deps).toHaveLength(1);
    expect(deps[0].id).toBe('node-a');
  });

  it('returns all transitive dependencies for complex node', () => {
    const nodeMap = createNodeMap(allNodes);
    const deps = getTransitiveDependencies(nodeF, nodeMap);
    
    // Node F has D and E as direct
    // Transitive: B (through D), C (through E), A (through B and C)
    expect(deps).toHaveLength(3);
    const depIds = deps.map((n) => n.id);
    expect(depIds).toContain('node-a');
    expect(depIds).toContain('node-b');
    expect(depIds).toContain('node-c');
  });
});

describe('getAllDependencies', () => {
  it('correctly categorizes direct and transitive dependencies', () => {
    const nodeMap = createNodeMap(allNodes);
    const { direct, transitive } = getAllDependencies(nodeF, nodeMap);
    
    expect(direct).toHaveLength(2);
    expect(direct.map((n) => n.id)).toContain('node-d');
    expect(direct.map((n) => n.id)).toContain('node-e');
    
    expect(transitive).toHaveLength(3);
    const transitiveIds = transitive.map((n) => n.id);
    expect(transitiveIds).toContain('node-a');
    expect(transitiveIds).toContain('node-b');
    expect(transitiveIds).toContain('node-c');
  });
});

describe('getAllAncestors', () => {
  it('returns all ancestor nodes', () => {
    const nodeMap = createNodeMap(allNodes);
    const ancestors = getAllAncestors(nodeF, nodeMap);
    
    // Should include all nodes except F itself
    expect(ancestors).toHaveLength(5);
    const ancestorIds = ancestors.map((n) => n.id);
    expect(ancestorIds).toContain('node-a');
    expect(ancestorIds).toContain('node-b');
    expect(ancestorIds).toContain('node-c');
    expect(ancestorIds).toContain('node-d');
    expect(ancestorIds).toContain('node-e');
  });

  it('returns empty for root node', () => {
    const nodeMap = createNodeMap(allNodes);
    const ancestors = getAllAncestors(nodeA, nodeMap);
    
    expect(ancestors).toHaveLength(0);
  });
});

describe('topologicalSort', () => {
  it('sorts nodes so dependencies come before dependents', () => {
    const sorted = topologicalSort(allNodes);
    
    // A should come before B, C
    // B should come before D
    // C should come before E
    // D, E should come before F
    const getIndex = (id: string) => sorted.findIndex((n) => n.id === id);
    
    expect(getIndex('node-a')).toBeLessThan(getIndex('node-b'));
    expect(getIndex('node-a')).toBeLessThan(getIndex('node-c'));
    expect(getIndex('node-b')).toBeLessThan(getIndex('node-d'));
    expect(getIndex('node-c')).toBeLessThan(getIndex('node-e'));
    expect(getIndex('node-d')).toBeLessThan(getIndex('node-f'));
    expect(getIndex('node-e')).toBeLessThan(getIndex('node-f'));
  });

  it('returns all nodes', () => {
    const sorted = topologicalSort(allNodes);
    expect(sorted).toHaveLength(allNodes.length);
  });

  it('handles single node', () => {
    const sorted = topologicalSort([nodeA]);
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toBe(nodeA);
  });

  it('handles empty array', () => {
    const sorted = topologicalSort([]);
    expect(sorted).toHaveLength(0);
  });
});

