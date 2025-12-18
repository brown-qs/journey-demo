/**
 * Integration tests for the useGraph hook.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGraph, useNodeDependencies, useNodeFields } from './useGraph';
import type { BlueprintGraph, FormNode, FormDefinition } from '../shared/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test fixtures
const createMockFormDefinition = (id: string): FormDefinition => ({
  id,
  name: 'Test Form',
  description: 'Test',
  is_reusable: false,
  field_schema: {
    type: 'object',
    properties: {
      email: { type: 'string', title: 'Email', avantos_type: 'short-text' },
      name: { type: 'string', title: 'Name', avantos_type: 'short-text' },
    },
  },
  ui_schema: { type: 'VerticalLayout', elements: [] },
});

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
    component_id: 'form-def-1',
    name,
    prerequisites,
    permitted_roles: [],
    input_mapping: {},
    sla_duration: { number: 0, unit: 'minutes' },
    approval_required: false,
    approval_roles: [],
  },
});

const createMockGraph = (): BlueprintGraph => ({
  $schema: 'test',
  id: 'bp-1',
  tenant_id: '1',
  name: 'Test Blueprint',
  description: 'Test Description',
  category: 'Test Category',
  nodes: [
    createMockNode('node-a', 'Form A'),
    createMockNode('node-b', 'Form B', ['node-a']),
    createMockNode('node-c', 'Form C', ['node-b']),
  ],
  edges: [
    { source: 'node-a', target: 'node-b' },
    { source: 'node-b', target: 'node-c' },
  ],
  forms: [createMockFormDefinition('form-def-1')],
  branches: [],
  triggers: [],
});

describe('useGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial loading', () => {
    it('starts in loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useGraph());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.graph).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('loads graph data successfully', async () => {
      const mockGraph = createMockGraph();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraph,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.graph).toEqual(mockGraph);
      expect(result.current.error).toBeNull();
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        status: 404,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.graph).toBeNull();
      expect(result.current.error).toContain('API request failed');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.graph).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('selectNode', () => {
    it('selects a node', async () => {
      const mockGraph = createMockGraph();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraph,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectNode(mockGraph.nodes[1]);
      });

      expect(result.current.selectedNode).toEqual(mockGraph.nodes[1]);
    });

    it('clears selection when null is passed', async () => {
      const mockGraph = createMockGraph();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraph,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectNode(mockGraph.nodes[1]);
      });

      expect(result.current.selectedNode).not.toBeNull();

      act(() => {
        result.current.selectNode(null);
      });

      expect(result.current.selectedNode).toBeNull();
    });
  });

  describe('updateMapping', () => {
    it('updates a field mapping', async () => {
      const mockGraph = createMockGraph();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraph,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateMapping('node-b', 'email', {
          type: 'form_field',
          sourceFormId: 'node-a',
          sourceFieldId: 'email',
        });
      });

      const updatedNode = result.current.graph?.nodes.find(n => n.id === 'node-b');
      expect(updatedNode?.data.input_mapping.email).toEqual({
        type: 'form_field',
        sourceFormId: 'node-a',
        sourceFieldId: 'email',
      });
    });

    it('clears a mapping when null is passed', async () => {
      const mockGraph = createMockGraph();
      // Add an existing mapping
      mockGraph.nodes[1].data.input_mapping = {
        email: { type: 'form_field', sourceFormId: 'node-a', sourceFieldId: 'email' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraph,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateMapping('node-b', 'email', null);
      });

      const updatedNode = result.current.graph?.nodes.find(n => n.id === 'node-b');
      expect(updatedNode?.data.input_mapping.email).toBeUndefined();
    });

    it('updates selected node when it is the modified node', async () => {
      const mockGraph = createMockGraph();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraph,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectNode(mockGraph.nodes[1]);
      });

      await act(async () => {
        await result.current.updateMapping('node-b', 'email', {
          type: 'form_field',
          sourceFormId: 'node-a',
          sourceFieldId: 'email',
        });
      });

      expect(result.current.selectedNode?.data.input_mapping.email).toBeDefined();
    });
  });

  describe('refetch', () => {
    it('refetches the graph data', async () => {
      const mockGraph = createMockGraph();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGraph,
      });

      const { result } = renderHook(() => useGraph());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});

describe('useNodeDependencies', () => {
  it('returns empty arrays when node is null', () => {
    const { result } = renderHook(() => useNodeDependencies(null, null));

    expect(result.current.direct).toEqual([]);
    expect(result.current.transitive).toEqual([]);
  });

  it('returns empty arrays when graph is null', () => {
    const node = createMockNode('node-a', 'Form A');
    const { result } = renderHook(() => useNodeDependencies(node, null));

    expect(result.current.direct).toEqual([]);
    expect(result.current.transitive).toEqual([]);
  });

  it('returns correct direct dependencies', () => {
    const graph = createMockGraph();
    const nodeB = graph.nodes[1]; // Has node-a as prerequisite

    const { result } = renderHook(() => useNodeDependencies(nodeB, graph));

    expect(result.current.direct).toHaveLength(1);
    expect(result.current.direct[0].id).toBe('node-a');
  });

  it('returns correct transitive dependencies', () => {
    const graph = createMockGraph();
    const nodeC = graph.nodes[2]; // Has node-b as prerequisite, node-a is transitive

    const { result } = renderHook(() => useNodeDependencies(nodeC, graph));

    expect(result.current.direct).toHaveLength(1);
    expect(result.current.direct[0].id).toBe('node-b');
    
    expect(result.current.transitive).toHaveLength(1);
    expect(result.current.transitive[0].id).toBe('node-a');
  });

  it('returns empty for root nodes', () => {
    const graph = createMockGraph();
    const nodeA = graph.nodes[0]; // No prerequisites

    const { result } = renderHook(() => useNodeDependencies(nodeA, graph));

    expect(result.current.direct).toHaveLength(0);
    expect(result.current.transitive).toHaveLength(0);
  });
});

describe('useNodeFields', () => {
  it('returns empty array when node is null', () => {
    const { result } = renderHook(() => useNodeFields(null, null));

    expect(result.current).toEqual([]);
  });

  it('returns empty array when graph is null', () => {
    const node = createMockNode('node-a', 'Form A');
    const { result } = renderHook(() => useNodeFields(node, null));

    expect(result.current).toEqual([]);
  });

  it('returns form fields from the field schema', () => {
    const graph = createMockGraph();
    const node = graph.nodes[0];

    const { result } = renderHook(() => useNodeFields(node, graph));

    expect(result.current).toHaveLength(2);
    expect(result.current.map(f => f.id)).toContain('email');
    expect(result.current.map(f => f.id)).toContain('name');
  });

  it('includes field metadata', () => {
    const graph = createMockGraph();
    const node = graph.nodes[0];

    const { result } = renderHook(() => useNodeFields(node, graph));

    const emailField = result.current.find(f => f.id === 'email');
    expect(emailField?.name).toBe('Email');
    expect(emailField?.type).toBe('string');
    expect(emailField?.avantosType).toBe('short-text');
  });

  it('returns empty when form definition not found', () => {
    const graph = createMockGraph();
    const node = createMockNode('orphan', 'Orphan Form');
    node.data.component_id = 'non-existent-form';
    graph.nodes.push(node);

    const { result } = renderHook(() => useNodeFields(node, graph));

    expect(result.current).toEqual([]);
  });
});

