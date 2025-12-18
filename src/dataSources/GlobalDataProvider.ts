/**
 * Data source provider for global data.
 * This includes Action Properties, Client Organization Properties, and custom global data.
 * 
 * This is an extensible provider - you can easily add more global data sources
 * by adding to the globalDataSources configuration.
 */
import type { FormNode, BlueprintGraph } from '../shared/types';
import type { 
  DataSourceProvider, 
  DataSourceGroup, 
} from './DataSourceProvider';

/**
 * Configuration for a global data source.
 */
interface GlobalDataSourceConfig {
  id: string;
  name: string;
  description?: string;
  fields: {
    id: string;
    name: string;
    type: string;
    path?: string;
  }[];
}

/**
 * Default global data sources.
 * Add new sources here to extend the system.
 */
const globalDataSources: GlobalDataSourceConfig[] = [
  {
    id: 'action-properties',
    name: 'Action Properties',
    description: 'Properties of the current action/workflow',
    fields: [
      { id: 'action_id', name: 'Action ID', type: 'string' },
      { id: 'action_name', name: 'Action Name', type: 'string' },
      { id: 'action_status', name: 'Action Status', type: 'string' },
      { id: 'created_at', name: 'Created At', type: 'datetime' },
      { id: 'updated_at', name: 'Updated At', type: 'datetime' },
    ],
  },
  {
    id: 'client-org-properties',
    name: 'Client Organisation Properties',
    description: 'Properties of the client organization',
    fields: [
      { id: 'org_id', name: 'Organisation ID', type: 'string' },
      { id: 'org_name', name: 'Organisation Name', type: 'string' },
      { id: 'org_email', name: 'Organisation Email', type: 'email' },
      { id: 'org_country', name: 'Country', type: 'string' },
      { id: 'org_timezone', name: 'Timezone', type: 'string' },
    ],
  },
  {
    id: 'user-context',
    name: 'User Context',
    description: 'Information about the current user',
    fields: [
      { id: 'user_id', name: 'User ID', type: 'string' },
      { id: 'user_email', name: 'User Email', type: 'email' },
      { id: 'user_name', name: 'User Name', type: 'string' },
      { id: 'user_role', name: 'User Role', type: 'string' },
    ],
  },
  {
    id: 'system-context',
    name: 'System Context',
    description: 'System-level information',
    fields: [
      { id: 'current_date', name: 'Current Date', type: 'date' },
      { id: 'current_time', name: 'Current Time', type: 'time' },
      { id: 'current_datetime', name: 'Current DateTime', type: 'datetime' },
      { id: 'environment', name: 'Environment', type: 'string' },
    ],
  },
];

/**
 * Provider for global data sources.
 */
export class GlobalDataProvider implements DataSourceProvider {
  id = 'global-data';
  name = 'Global Data';
  priority = 30;

  private sources: GlobalDataSourceConfig[];

  constructor(customSources?: GlobalDataSourceConfig[]) {
    this.sources = customSources || globalDataSources;
  }

  isApplicable(_node: FormNode, _graph: BlueprintGraph): boolean {
    // Global data is always applicable
    return true;
  }

  getDataSources(_node: FormNode, _graph: BlueprintGraph): DataSourceGroup[] {
    return this.sources.map((source) => ({
      id: `global-${source.id}`,
      name: source.name,
      type: 'global' as const,
      description: source.description,
      items: source.fields.map((field) => ({
        id: `${source.id}:${field.id}`,
        label: `${source.name}.${field.name}`,
        type: 'global' as const,
        sourceId: source.id,
        sourceName: source.name,
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.type,
        path: field.path || `${source.id}.${field.id}`,
      })),
    }));
  }

  /**
   * Add a custom global data source.
   */
  addSource(source: GlobalDataSourceConfig): void {
    this.sources.push(source);
  }

  /**
   * Remove a global data source by ID.
   */
  removeSource(sourceId: string): void {
    this.sources = this.sources.filter((s) => s.id !== sourceId);
  }
}

// Factory function to create a custom global data provider
export const createGlobalDataProvider = (
  sources?: GlobalDataSourceConfig[]
): GlobalDataProvider => {
  return new GlobalDataProvider(sources);
};

