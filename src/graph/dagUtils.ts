/**
 * DAG (Directed Acyclic Graph) utilities for traversing form dependencies.
 * These functions help find direct and transitive dependencies of forms.
 */
import type { FormNode, DependencyInfo, BlueprintGraph } from '../shared/types';

/**
 * Creates a map of form nodes by their ID for quick lookup.
 */
export const createNodeMap = (nodes: FormNode[]): Map<string, FormNode> => {
  return new Map(nodes.map((node) => [node.id, node]));
};

/**
 * Gets the direct dependencies (prerequisites) of a form node.
 * Direct dependencies are forms that this form immediately depends on.
 */
export const getDirectDependencies = (
  node: FormNode,
  nodeMap: Map<string, FormNode>
): FormNode[] => {
  return node.data.prerequisites
    .map((prereqId) => nodeMap.get(prereqId))
    .filter((n): n is FormNode => n !== undefined);
};

/**
 * Gets all transitive dependencies of a form node using BFS.
 * Transitive dependencies are forms that this form indirectly depends on
 * (dependencies of dependencies).
 */
export const getTransitiveDependencies = (
  node: FormNode,
  nodeMap: Map<string, FormNode>
): FormNode[] => {
  const directDeps = new Set(node.data.prerequisites);
  const transitiveDeps: FormNode[] = [];
  const visited = new Set<string>([node.id]);
  const queue: string[] = [...node.data.prerequisites];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (visited.has(currentId)) {
      continue;
    }
    
    visited.add(currentId);
    const currentNode = nodeMap.get(currentId);
    
    if (!currentNode) {
      continue;
    }

    // Add the prerequisites of the current node to the queue
    for (const prereqId of currentNode.data.prerequisites) {
      if (!visited.has(prereqId)) {
        queue.push(prereqId);
        
        // If this prereq is not a direct dependency, it's transitive
        if (!directDeps.has(prereqId)) {
          const prereqNode = nodeMap.get(prereqId);
          if (prereqNode && !transitiveDeps.some((n) => n.id === prereqId)) {
            transitiveDeps.push(prereqNode);
          }
        }
      }
    }
  }

  return transitiveDeps;
};

/**
 * Gets all dependencies of a form node, categorized as direct or transitive.
 */
export const getAllDependencies = (
  node: FormNode,
  nodeMap: Map<string, FormNode>
): DependencyInfo => {
  const direct = getDirectDependencies(node, nodeMap);
  const transitive = getTransitiveDependencies(node, nodeMap);
  
  return { direct, transitive };
};

/**
 * Gets all ancestor nodes (all forms that this form depends on, directly or indirectly).
 */
export const getAllAncestors = (
  node: FormNode,
  nodeMap: Map<string, FormNode>
): FormNode[] => {
  const ancestors: FormNode[] = [];
  const visited = new Set<string>([node.id]);
  const queue: string[] = [...node.data.prerequisites];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (visited.has(currentId)) {
      continue;
    }
    
    visited.add(currentId);
    const currentNode = nodeMap.get(currentId);
    
    if (!currentNode) {
      continue;
    }

    ancestors.push(currentNode);

    // Add the prerequisites of the current node to the queue
    for (const prereqId of currentNode.data.prerequisites) {
      if (!visited.has(prereqId)) {
        queue.push(prereqId);
      }
    }
  }

  return ancestors;
};

/**
 * Sorts nodes in topological order (forms without dependencies first).
 */
export const topologicalSort = (nodes: FormNode[]): FormNode[] => {
  const nodeMap = createNodeMap(nodes);
  const sorted: FormNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (node: FormNode): void => {
    if (visited.has(node.id)) {
      return;
    }
    
    if (visiting.has(node.id)) {
      // Cycle detected - shouldn't happen in a DAG
      console.warn('Cycle detected in form dependencies');
      return;
    }

    visiting.add(node.id);

    // Visit all prerequisites first
    for (const prereqId of node.data.prerequisites) {
      const prereqNode = nodeMap.get(prereqId);
      if (prereqNode) {
        visit(prereqNode);
      }
    }

    visiting.delete(node.id);
    visited.add(node.id);
    sorted.push(node);
  };

  for (const node of nodes) {
    visit(node);
  }

  return sorted;
};

/**
 * Gets the form definition for a node from the graph.
 */
export const getFormDefinition = (
  node: FormNode,
  graph: BlueprintGraph
) => {
  return graph.forms.find((form) => form.id === node.data.component_id);
};

/**
 * Gets all fields from a form's field schema.
 */
export const getFormFields = (
  node: FormNode,
  graph: BlueprintGraph
): { id: string; name: string; type: string; avantosType?: string }[] => {
  const formDef = getFormDefinition(node, graph);
  
  if (!formDef?.field_schema?.properties) {
    return [];
  }

  return Object.entries(formDef.field_schema.properties).map(([fieldId, fieldSchema]) => ({
    id: fieldId,
    name: fieldSchema.title || fieldId,
    type: fieldSchema.type,
    avantosType: fieldSchema.avantos_type,
  }));
};

