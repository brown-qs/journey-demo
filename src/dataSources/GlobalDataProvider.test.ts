/**
 * Tests for Global Data Provider.
 */
import { describe, it, expect } from 'vitest';
import { GlobalDataProvider, createGlobalDataProvider } from './GlobalDataProvider';
import type { FormNode, BlueprintGraph } from '../shared/types';

const mockNode: FormNode = {
  id: 'test-node',
  type: 'form',
  position: { x: 0, y: 0 },
  data: {
    id: 'data-test',
    component_key: 'test-node',
    component_type: 'form',
    component_id: 'form-def-1',
    name: 'Test Form',
    prerequisites: [],
    permitted_roles: [],
    input_mapping: {},
    sla_duration: { number: 0, unit: 'minutes' },
    approval_required: false,
    approval_roles: [],
  },
};

const mockGraph: BlueprintGraph = {
  $schema: 'test',
  id: 'bp-1',
  tenant_id: '1',
  name: 'Test Blueprint',
  description: 'Test',
  category: 'Test',
  nodes: [mockNode],
  edges: [],
  forms: [],
  branches: [],
  triggers: [],
};

describe('GlobalDataProvider', () => {
  describe('default configuration', () => {
    const provider = new GlobalDataProvider();

    it('has correct metadata', () => {
      expect(provider.id).toBe('global-data');
      expect(provider.name).toBe('Global Data');
      expect(provider.priority).toBe(30);
    });

    it('is always applicable', () => {
      expect(provider.isApplicable(mockNode, mockGraph)).toBe(true);
    });

    it('returns default global data sources', () => {
      const sources = provider.getDataSources(mockNode, mockGraph);
      
      expect(sources.length).toBeGreaterThan(0);
      
      const sourceNames = sources.map((s) => s.name);
      expect(sourceNames).toContain('Action Properties');
      expect(sourceNames).toContain('Client Organisation Properties');
    });

    it('marks all items as global type', () => {
      const sources = provider.getDataSources(mockNode, mockGraph);
      
      for (const source of sources) {
        expect(source.type).toBe('global');
        for (const item of source.items) {
          expect(item.type).toBe('global');
        }
      }
    });
  });

  describe('custom configuration', () => {
    it('accepts custom sources', () => {
      const customSources = [
        {
          id: 'custom-source',
          name: 'Custom Source',
          description: 'Custom data source',
          fields: [
            { id: 'field1', name: 'Field 1', type: 'string' },
            { id: 'field2', name: 'Field 2', type: 'number' },
          ],
        },
      ];

      const provider = new GlobalDataProvider(customSources);
      const sources = provider.getDataSources(mockNode, mockGraph);

      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Custom Source');
      expect(sources[0].items).toHaveLength(2);
    });
  });

  describe('addSource', () => {
    it('adds a new source to existing sources', () => {
      const provider = new GlobalDataProvider([]);
      
      provider.addSource({
        id: 'new-source',
        name: 'New Source',
        fields: [{ id: 'newField', name: 'New Field', type: 'string' }],
      });

      const sources = provider.getDataSources(mockNode, mockGraph);
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('New Source');
    });
  });

  describe('removeSource', () => {
    it('removes a source by id', () => {
      const provider = new GlobalDataProvider([
        { id: 'source-1', name: 'Source 1', fields: [] },
        { id: 'source-2', name: 'Source 2', fields: [] },
      ]);

      provider.removeSource('source-1');

      const sources = provider.getDataSources(mockNode, mockGraph);
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Source 2');
    });
  });

  describe('createGlobalDataProvider factory', () => {
    it('creates provider with custom sources', () => {
      const provider = createGlobalDataProvider([
        { id: 'factory-source', name: 'Factory Source', fields: [] },
      ]);

      const sources = provider.getDataSources(mockNode, mockGraph);
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Factory Source');
    });

    it('creates provider with default sources when no args', () => {
      const provider = createGlobalDataProvider();
      const sources = provider.getDataSources(mockNode, mockGraph);
      
      expect(sources.length).toBeGreaterThan(0);
    });
  });
});

