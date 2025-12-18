/**
 * Extensible Data Source Provider Architecture
 * 
 * This module implements the Strategy pattern for data sources.
 * New data sources can be easily added by implementing the DataSourceProvider interface
 * and registering them with the DataSourceRegistry.
 * 
 * Current data sources:
 * - Form fields from direct dependencies
 * - Form fields from transitive dependencies
 * - Global data (configurable)
 * 
 * To add a new data source:
 * 1. Create a class implementing DataSourceProvider
 * 2. Register it with dataSourceRegistry.register()
 */

import type { FormNode, BlueprintGraph } from '../shared/types';

/**
 * Represents a single data item that can be used for prefilling.
 */
export interface DataSourceItem {
  id: string;
  label: string;
  type: 'form_field' | 'global';
  sourceId: string;  // Form ID for form fields, source name for global
  sourceName: string;
  fieldId: string;
  fieldName: string;
  fieldType?: string;
  path?: string;  // Full path for nested data
}

/**
 * Represents a group of data items from the same source.
 */
export interface DataSourceGroup {
  id: string;
  name: string;
  type: 'form' | 'global';
  items: DataSourceItem[];
  description?: string;
}

/**
 * Interface for data source providers.
 * Implement this interface to add new data sources.
 */
export interface DataSourceProvider {
  /** Unique identifier for this provider */
  id: string;
  
  /** Display name for this provider */
  name: string;
  
  /** Priority for ordering (lower = higher priority) */
  priority: number;
  
  /**
   * Get available data source groups for a given form node.
   * @param node The currently selected form node
   * @param graph The complete blueprint graph
   * @returns Array of data source groups
   */
  getDataSources(node: FormNode, graph: BlueprintGraph): DataSourceGroup[];
  
  /**
   * Check if this provider is applicable for the given context.
   * @param node The currently selected form node
   * @param graph The complete blueprint graph
   */
  isApplicable(node: FormNode, graph: BlueprintGraph): boolean;
}

/**
 * Registry for managing data source providers.
 * Supports dynamic registration of new providers.
 */
export class DataSourceRegistry {
  private providers: Map<string, DataSourceProvider> = new Map();

  /**
   * Register a new data source provider.
   */
  register(provider: DataSourceProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Unregister a data source provider.
   */
  unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  /**
   * Get all registered providers, sorted by priority.
   */
  getProviders(): DataSourceProvider[] {
    return Array.from(this.providers.values()).sort(
      (a, b) => a.priority - b.priority
    );
  }

  /**
   * Get all applicable data sources for a node.
   */
  getAllDataSources(node: FormNode, graph: BlueprintGraph): DataSourceGroup[] {
    const groups: DataSourceGroup[] = [];

    for (const provider of this.getProviders()) {
      if (provider.isApplicable(node, graph)) {
        groups.push(...provider.getDataSources(node, graph));
      }
    }

    return groups;
  }
}

// Global registry instance
export const dataSourceRegistry = new DataSourceRegistry();

