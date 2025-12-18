/**
 * Tests for the Data Source Provider architecture.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DataSourceRegistry,
} from './DataSourceProvider';
import type {
  DataSourceProvider,
  DataSourceGroup,
} from './DataSourceProvider';
import type { FormNode, BlueprintGraph } from '../shared/types';

// Mock node for testing
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
    prerequisites: ['prereq-1'],
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

// Mock provider for testing
class TestProvider implements DataSourceProvider {
  id = 'test-provider';
  name = 'Test Provider';
  priority: number;
  private applicable: boolean;
  private sources: DataSourceGroup[];

  constructor(priority: number, applicable: boolean, sources: DataSourceGroup[]) {
    this.priority = priority;
    this.applicable = applicable;
    this.sources = sources;
  }

  isApplicable(): boolean {
    return this.applicable;
  }

  getDataSources(): DataSourceGroup[] {
    return this.sources;
  }
}

describe('DataSourceRegistry', () => {
  let registry: DataSourceRegistry;

  beforeEach(() => {
    registry = new DataSourceRegistry();
  });

  describe('register', () => {
    it('registers a provider', () => {
      const provider = new TestProvider(10, true, []);
      registry.register(provider);
      
      expect(registry.getProviders()).toHaveLength(1);
      expect(registry.getProviders()[0].id).toBe('test-provider');
    });

    it('replaces provider with same id', () => {
      const provider1 = new TestProvider(10, true, []);
      const provider2 = new TestProvider(20, true, []);
      provider2.id = 'test-provider'; // Same ID
      
      registry.register(provider1);
      registry.register(provider2);
      
      expect(registry.getProviders()).toHaveLength(1);
      expect(registry.getProviders()[0].priority).toBe(20);
    });
  });

  describe('unregister', () => {
    it('removes a registered provider', () => {
      const provider = new TestProvider(10, true, []);
      registry.register(provider);
      registry.unregister('test-provider');
      
      expect(registry.getProviders()).toHaveLength(0);
    });

    it('handles unregistering non-existent provider', () => {
      expect(() => registry.unregister('non-existent')).not.toThrow();
    });
  });

  describe('getProviders', () => {
    it('returns providers sorted by priority', () => {
      const provider1 = new TestProvider(30, true, []);
      provider1.id = 'provider-1';
      
      const provider2 = new TestProvider(10, true, []);
      provider2.id = 'provider-2';
      
      const provider3 = new TestProvider(20, true, []);
      provider3.id = 'provider-3';
      
      registry.register(provider1);
      registry.register(provider2);
      registry.register(provider3);
      
      const providers = registry.getProviders();
      expect(providers[0].id).toBe('provider-2'); // priority 10
      expect(providers[1].id).toBe('provider-3'); // priority 20
      expect(providers[2].id).toBe('provider-1'); // priority 30
    });
  });

  describe('getAllDataSources', () => {
    it('returns data sources from all applicable providers', () => {
      const sources1: DataSourceGroup[] = [{
        id: 'group-1',
        name: 'Group 1',
        type: 'form',
        items: [],
      }];
      
      const sources2: DataSourceGroup[] = [{
        id: 'group-2',
        name: 'Group 2',
        type: 'global',
        items: [],
      }];
      
      const provider1 = new TestProvider(10, true, sources1);
      provider1.id = 'provider-1';
      
      const provider2 = new TestProvider(20, true, sources2);
      provider2.id = 'provider-2';
      
      registry.register(provider1);
      registry.register(provider2);
      
      const allSources = registry.getAllDataSources(mockNode, mockGraph);
      expect(allSources).toHaveLength(2);
      expect(allSources[0].id).toBe('group-1');
      expect(allSources[1].id).toBe('group-2');
    });

    it('excludes non-applicable providers', () => {
      const sources1: DataSourceGroup[] = [{
        id: 'group-1',
        name: 'Group 1',
        type: 'form',
        items: [],
      }];
      
      const sources2: DataSourceGroup[] = [{
        id: 'group-2',
        name: 'Group 2',
        type: 'global',
        items: [],
      }];
      
      const provider1 = new TestProvider(10, true, sources1);
      provider1.id = 'provider-1';
      
      const provider2 = new TestProvider(20, false, sources2); // Not applicable
      provider2.id = 'provider-2';
      
      registry.register(provider1);
      registry.register(provider2);
      
      const allSources = registry.getAllDataSources(mockNode, mockGraph);
      expect(allSources).toHaveLength(1);
      expect(allSources[0].id).toBe('group-1');
    });
  });
});

