/**
 * React hook for managing the blueprint graph state.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BlueprintGraph, FormNode } from '../shared/types';
import { fetchBlueprintGraph, updatePrefillMapping } from './graphService';
import { createNodeMap, getAllDependencies, getFormFields } from './dagUtils';

interface UseGraphReturn {
  graph: BlueprintGraph | null;
  isLoading: boolean;
  error: string | null;
  selectedNode: FormNode | null;
  selectNode: (node: FormNode | null) => void;
  updateMapping: (
    nodeId: string,
    fieldId: string,
    mapping: { type: string; sourceFormId?: string; sourceFieldId: string } | null
  ) => Promise<void>;
  refetch: () => void;
}

export const useGraph = (): UseGraphReturn => {
  const [graph, setGraph] = useState<BlueprintGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FormNode | null>(null);

  const loadGraph = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchBlueprintGraph()
      .map((data) => {
        setGraph(data);
        setIsLoading(false);
      })
      .mapErr((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const selectNode = useCallback((node: FormNode | null) => {
    setSelectedNode(node);
  }, []);

  const updateMapping = useCallback(
    async (
      nodeId: string,
      fieldId: string,
      mapping: { type: string; sourceFormId?: string; sourceFieldId: string } | null
    ) => {
      if (!graph) return;

      const result = await updatePrefillMapping(graph, nodeId, fieldId, mapping);
      
      result
        .map((updatedGraph) => {
          setGraph(updatedGraph);
          // Update selected node if it was the one modified
          if (selectedNode?.id === nodeId) {
            const updatedNode = updatedGraph.nodes.find((n) => n.id === nodeId);
            if (updatedNode) {
              setSelectedNode(updatedNode);
            }
          }
        })
        .mapErr((err) => {
          setError(err.message);
        });
    },
    [graph, selectedNode]
  );

  return {
    graph,
    isLoading,
    error,
    selectedNode,
    selectNode,
    updateMapping,
    refetch: loadGraph,
  };
};

/**
 * Hook for getting dependency information for a selected node.
 */
export const useNodeDependencies = (
  node: FormNode | null,
  graph: BlueprintGraph | null
) => {
  return useMemo(() => {
    if (!node || !graph) {
      return { direct: [], transitive: [] };
    }

    const nodeMap = createNodeMap(graph.nodes);
    return getAllDependencies(node, nodeMap);
  }, [node, graph]);
};

/**
 * Hook for getting field information for a node.
 */
export const useNodeFields = (
  node: FormNode | null,
  graph: BlueprintGraph | null
) => {
  return useMemo(() => {
    if (!node || !graph) {
      return [];
    }

    return getFormFields(node, graph);
  }, [node, graph]);
};

