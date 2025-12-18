/**
 * Data Sources Module
 * 
 * This module provides an extensible architecture for data sources
 * that can be used to prefill form fields.
 * 
 * ## How to add a new data source:
 * 
 * 1. Create a new provider class implementing DataSourceProvider:
 * 
 * ```typescript
 * import { DataSourceProvider, DataSourceGroup } from './DataSourceProvider';
 * 
 * export class MyCustomProvider implements DataSourceProvider {
 *   id = 'my-custom-provider';
 *   name = 'My Custom Data';
 *   priority = 40;  // Lower = higher priority
 * 
 *   isApplicable(node: FormNode, graph: BlueprintGraph): boolean {
 *     return true;  // Or your condition
 *   }
 * 
 *   getDataSources(node: FormNode, graph: BlueprintGraph): DataSourceGroup[] {
 *     return [{
 *       id: 'my-group',
 *       name: 'My Data Group',
 *       type: 'global',
 *       items: [{
 *         id: 'my-item',
 *         label: 'My Item',
 *         type: 'global',
 *         sourceId: 'my-source',
 *         sourceName: 'My Source',
 *         fieldId: 'my-field',
 *         fieldName: 'My Field',
 *       }],
 *     }];
 *   }
 * }
 * ```
 * 
 * 2. Register it with the registry:
 * 
 * ```typescript
 * import { dataSourceRegistry } from './dataSources';
 * import { MyCustomProvider } from './MyCustomProvider';
 * 
 * dataSourceRegistry.register(new MyCustomProvider());
 * ```
 * 
 * That's it! The new data source will now appear in the prefill selection UI.
 */

export type { 
  DataSourceProvider, 
  DataSourceGroup, 
  DataSourceItem,
} from './DataSourceProvider';

export { 
  DataSourceRegistry,
  dataSourceRegistry 
} from './DataSourceProvider';

export { 
  DirectDependencyFieldsProvider, 
  TransitiveDependencyFieldsProvider 
} from './FormFieldsProvider';

export { 
  GlobalDataProvider, 
  createGlobalDataProvider 
} from './GlobalDataProvider';

// Import and register default providers
import { dataSourceRegistry } from './DataSourceProvider';
import { DirectDependencyFieldsProvider, TransitiveDependencyFieldsProvider } from './FormFieldsProvider';
import { GlobalDataProvider } from './GlobalDataProvider';

// Register default providers
dataSourceRegistry.register(new DirectDependencyFieldsProvider());
dataSourceRegistry.register(new TransitiveDependencyFieldsProvider());
dataSourceRegistry.register(new GlobalDataProvider());

