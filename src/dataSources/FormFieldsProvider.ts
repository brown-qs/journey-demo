/**
 * Data source provider for form fields from dependencies.
 * Provides fields from both direct and transitive dependencies.
 */
import type { FormNode, BlueprintGraph } from '../shared/types';
import type { 
  DataSourceProvider, 
  DataSourceGroup, 
} from './DataSourceProvider';
import { 
  createNodeMap, 
  getDirectDependencies, 
  getTransitiveDependencies,
  getFormFields 
} from '../graph/dagUtils';

/**
 * Provider for form fields from direct dependencies.
 * These are forms that the selected form immediately depends on.
 */
export class DirectDependencyFieldsProvider implements DataSourceProvider {
  id = 'direct-dependencies';
  name = 'Direct Dependencies';
  priority = 10;

  isApplicable(node: FormNode, _graph: BlueprintGraph): boolean {
    return node.data.prerequisites.length > 0;
  }

  getDataSources(node: FormNode, graph: BlueprintGraph): DataSourceGroup[] {
    const nodeMap = createNodeMap(graph.nodes);
    const directDeps = getDirectDependencies(node, nodeMap);

    return directDeps.map((depNode) => this.createGroupForNode(depNode, graph));
  }

  private createGroupForNode(
    node: FormNode,
    graph: BlueprintGraph
  ): DataSourceGroup {
    const fields = getFormFields(node, graph);

    return {
      id: `form-${node.id}`,
      name: node.data.name,
      type: 'form',
      description: 'Direct dependency',
      items: fields.map((field) => ({
        id: `${node.id}:${field.id}`,
        label: `${node.data.name}.${field.name}`,
        type: 'form_field' as const,
        sourceId: node.id,
        sourceName: node.data.name,
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.avantosType || field.type,
      })),
    };
  }
}

/**
 * Provider for form fields from transitive dependencies.
 * These are forms that the selected form indirectly depends on.
 */
export class TransitiveDependencyFieldsProvider implements DataSourceProvider {
  id = 'transitive-dependencies';
  name = 'Transitive Dependencies';
  priority = 20;

  isApplicable(node: FormNode, graph: BlueprintGraph): boolean {
    const nodeMap = createNodeMap(graph.nodes);
    const transitiveDeps = getTransitiveDependencies(node, nodeMap);
    return transitiveDeps.length > 0;
  }

  getDataSources(node: FormNode, graph: BlueprintGraph): DataSourceGroup[] {
    const nodeMap = createNodeMap(graph.nodes);
    const transitiveDeps = getTransitiveDependencies(node, nodeMap);

    return transitiveDeps.map((depNode) => this.createGroupForNode(depNode, graph));
  }

  private createGroupForNode(
    node: FormNode,
    graph: BlueprintGraph
  ): DataSourceGroup {
    const fields = getFormFields(node, graph);

    return {
      id: `form-${node.id}`,
      name: node.data.name,
      type: 'form',
      description: 'Transitive dependency',
      items: fields.map((field) => ({
        id: `${node.id}:${field.id}`,
        label: `${node.data.name}.${field.name}`,
        type: 'form_field' as const,
        sourceId: node.id,
        sourceName: node.data.name,
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.avantosType || field.type,
      })),
    };
  }
}

