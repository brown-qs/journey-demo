/**
 * Tests for Form Fields Data Source Providers.
 */
import { describe, it, expect } from 'vitest';
import {
  DirectDependencyFieldsProvider,
  TransitiveDependencyFieldsProvider,
} from './FormFieldsProvider';
import type { FormNode, BlueprintGraph, FormDefinition } from '../shared/types';

// Create a complete mock graph
const createMockGraph = (): BlueprintGraph => {
  const formDefinition: FormDefinition = {
    id: 'form-def-1',
    name: 'Test Form',
    description: 'Test',
    is_reusable: false,
    field_schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          title: 'Email',
          avantos_type: 'short-text',
        },
        name: {
          type: 'string',
          title: 'Name',
          avantos_type: 'short-text',
        },
      },
    },
    ui_schema: { type: 'VerticalLayout', elements: [] },
  };

  const nodeA: FormNode = {
    id: 'node-a',
    type: 'form',
    position: { x: 0, y: 0 },
    data: {
      id: 'data-a',
      component_key: 'node-a',
      component_type: 'form',
      component_id: 'form-def-1',
      name: 'Form A',
      prerequisites: [],
      permitted_roles: [],
      input_mapping: {},
      sla_duration: { number: 0, unit: 'minutes' },
      approval_required: false,
      approval_roles: [],
    },
  };

  const nodeB: FormNode = {
    id: 'node-b',
    type: 'form',
    position: { x: 100, y: 0 },
    data: {
      id: 'data-b',
      component_key: 'node-b',
      component_type: 'form',
      component_id: 'form-def-1',
      name: 'Form B',
      prerequisites: ['node-a'],
      permitted_roles: [],
      input_mapping: {},
      sla_duration: { number: 0, unit: 'minutes' },
      approval_required: false,
      approval_roles: [],
    },
  };

  const nodeC: FormNode = {
    id: 'node-c',
    type: 'form',
    position: { x: 200, y: 0 },
    data: {
      id: 'data-c',
      component_key: 'node-c',
      component_type: 'form',
      component_id: 'form-def-1',
      name: 'Form C',
      prerequisites: ['node-b'],
      permitted_roles: [],
      input_mapping: {},
      sla_duration: { number: 0, unit: 'minutes' },
      approval_required: false,
      approval_roles: [],
    },
  };

  return {
    $schema: 'test',
    id: 'bp-1',
    tenant_id: '1',
    name: 'Test Blueprint',
    description: 'Test',
    category: 'Test',
    nodes: [nodeA, nodeB, nodeC],
    edges: [
      { source: 'node-a', target: 'node-b' },
      { source: 'node-b', target: 'node-c' },
    ],
    forms: [formDefinition],
    branches: [],
    triggers: [],
  };
};

describe('DirectDependencyFieldsProvider', () => {
  const provider = new DirectDependencyFieldsProvider();

  it('has correct metadata', () => {
    expect(provider.id).toBe('direct-dependencies');
    expect(provider.name).toBe('Direct Dependencies');
    expect(provider.priority).toBe(10);
  });

  describe('isApplicable', () => {
    it('returns true when node has prerequisites', () => {
      const graph = createMockGraph();
      const nodeB = graph.nodes.find((n) => n.id === 'node-b')!;
      
      expect(provider.isApplicable(nodeB, graph)).toBe(true);
    });

    it('returns false when node has no prerequisites', () => {
      const graph = createMockGraph();
      const nodeA = graph.nodes.find((n) => n.id === 'node-a')!;
      
      expect(provider.isApplicable(nodeA, graph)).toBe(false);
    });
  });

  describe('getDataSources', () => {
    it('returns data source groups for direct dependencies', () => {
      const graph = createMockGraph();
      const nodeB = graph.nodes.find((n) => n.id === 'node-b')!;
      
      const sources = provider.getDataSources(nodeB, graph);
      
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Form A');
      expect(sources[0].type).toBe('form');
    });

    it('includes fields from the form definition', () => {
      const graph = createMockGraph();
      const nodeB = graph.nodes.find((n) => n.id === 'node-b')!;
      
      const sources = provider.getDataSources(nodeB, graph);
      const items = sources[0].items;
      
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.fieldId)).toContain('email');
      expect(items.map((i) => i.fieldId)).toContain('name');
    });

    it('sets correct item properties', () => {
      const graph = createMockGraph();
      const nodeB = graph.nodes.find((n) => n.id === 'node-b')!;
      
      const sources = provider.getDataSources(nodeB, graph);
      const emailItem = sources[0].items.find((i) => i.fieldId === 'email');
      
      expect(emailItem).toBeDefined();
      expect(emailItem!.type).toBe('form_field');
      expect(emailItem!.sourceId).toBe('node-a');
      expect(emailItem!.sourceName).toBe('Form A');
      expect(emailItem!.fieldName).toBe('Email');
    });
  });
});

describe('TransitiveDependencyFieldsProvider', () => {
  const provider = new TransitiveDependencyFieldsProvider();

  it('has correct metadata', () => {
    expect(provider.id).toBe('transitive-dependencies');
    expect(provider.name).toBe('Transitive Dependencies');
    expect(provider.priority).toBe(20);
  });

  describe('isApplicable', () => {
    it('returns true when node has transitive dependencies', () => {
      const graph = createMockGraph();
      const nodeC = graph.nodes.find((n) => n.id === 'node-c')!;
      
      // Node C depends on B, which depends on A
      // So A is a transitive dependency
      expect(provider.isApplicable(nodeC, graph)).toBe(true);
    });

    it('returns false when node has only direct dependencies', () => {
      const graph = createMockGraph();
      const nodeB = graph.nodes.find((n) => n.id === 'node-b')!;
      
      // Node B only has A as direct dependency, no transitive
      expect(provider.isApplicable(nodeB, graph)).toBe(false);
    });
  });

  describe('getDataSources', () => {
    it('returns data source groups for transitive dependencies', () => {
      const graph = createMockGraph();
      const nodeC = graph.nodes.find((n) => n.id === 'node-c')!;
      
      const sources = provider.getDataSources(nodeC, graph);
      
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Form A');
      expect(sources[0].description).toBe('Transitive dependency');
    });
  });
});

