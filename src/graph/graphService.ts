/**
 * Service for fetching the blueprint graph from the API.
 */
import { ResultAsync, errAsync, okAsync } from 'neverthrow';
import type { BlueprintGraph } from '../shared/types';
import { ApiError, NetworkError } from '../shared/BaseError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Fetches the blueprint graph from the mock server.
 * The endpoint pattern is: /api/v1/{tenant_id}/actions/blueprints/{blueprint_id}/graph
 */
export const fetchBlueprintGraph = (
  tenantId: string = '1',
  blueprintId: string = 'bp_01jk766tckfwx84xjcxazggzyc'
): ResultAsync<BlueprintGraph, ApiError | NetworkError> => {
  const url = `${API_BASE_URL}/api/v1/${tenantId}/actions/blueprints/${blueprintId}/graph`;

  return ResultAsync.fromPromise(
    fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new ApiError(
          `API request failed: ${response.statusText}`,
          response.status
        );
      }
      return response.json() as Promise<BlueprintGraph>;
    }),
    (error) => {
      if (error instanceof ApiError) {
        return error;
      }
      return new NetworkError(
        'Failed to connect to the server. Make sure the mock server is running on port 3000.',
        error as Error
      );
    }
  );
};

/**
 * Updates the prefill mapping for a specific form node.
 * In a real application, this would make a PUT request to the API.
 * For now, it just updates the local state.
 */
export const updatePrefillMapping = (
  graph: BlueprintGraph,
  nodeId: string,
  fieldId: string,
  mapping: { type: string; sourceFormId?: string; sourceFieldId: string } | null
): ResultAsync<BlueprintGraph, ApiError> => {
  // Find the node to update
  const nodeIndex = graph.nodes.findIndex((n) => n.id === nodeId);
  
  if (nodeIndex === -1) {
    return errAsync(new ApiError(`Node with id ${nodeId} not found`));
  }

  // Create updated graph with new mapping
  const updatedNodes = [...graph.nodes];
  const updatedNode = { ...updatedNodes[nodeIndex] };
  const updatedData = { ...updatedNode.data };
  const updatedMapping = { ...updatedData.input_mapping };

  if (mapping === null) {
    // Remove the mapping
    delete updatedMapping[fieldId];
  } else {
    // Add or update the mapping
    updatedMapping[fieldId] = {
      type: mapping.type as 'form_field' | 'global',
      sourceFieldId: mapping.sourceFieldId,
      ...(mapping.sourceFormId && { sourceFormId: mapping.sourceFormId }),
    };
  }

  updatedData.input_mapping = updatedMapping;
  updatedNode.data = updatedData;
  updatedNodes[nodeIndex] = updatedNode;

  const updatedGraph: BlueprintGraph = {
    ...graph,
    nodes: updatedNodes,
  };

  // In a real app, we would POST/PUT this to the server
  // For now, just return the updated graph
  return okAsync(updatedGraph);
};

