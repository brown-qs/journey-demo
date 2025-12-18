/**
 * Core type definitions for the Journey Builder application.
 * These types represent the data structures returned by the API.
 */

// Form field types
export interface FieldSchema {
  type: string;
  title?: string;
  avantos_type?: string;
  format?: string;
  items?: {
    type: string;
    enum?: string[];
  };
  enum?: unknown[];
  uniqueItems?: boolean;
  properties?: Record<string, FieldSchema>;
  required?: string[];
}

// Form definition
export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  is_reusable: boolean;
  field_schema: FieldSchema;
  ui_schema: UiSchema;
  dynamic_field_config?: Record<string, DynamicFieldConfig>;
}

export interface UiSchema {
  type: string;
  elements: UiElement[];
}

export interface UiElement {
  type: string;
  scope: string;
  label: string;
  options?: Record<string, unknown>;
}

export interface DynamicFieldConfig {
  selector_field: string;
  payload_fields: Record<string, PayloadField>;
  endpoint_id: string;
}

export interface PayloadField {
  type: string;
  value: string;
}

// Graph node types
export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  component_key: string;
  component_type: string;
  component_id: string;
  name: string;
  prerequisites: string[];
  permitted_roles: string[];
  input_mapping: Record<string, PrefillMapping>;
  sla_duration: {
    number: number;
    unit: string;
  };
  approval_required: boolean;
  approval_roles: string[];
}

export interface FormNode {
  id: string;
  type: string;
  position: NodePosition;
  data: NodeData;
}

export interface Edge {
  source: string;
  target: string;
}

// Complete graph response
export interface BlueprintGraph {
  $schema: string;
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  category: string;
  nodes: FormNode[];
  edges: Edge[];
  forms: FormDefinition[];
  branches: unknown[];
  triggers: unknown[];
}

// Prefill mapping types
export interface PrefillMapping {
  type: 'form_field' | 'global';
  sourceFormId?: string;
  sourceFieldId: string;
  sourcePath?: string;
}

// Form field info for display
export interface FieldInfo {
  id: string;
  name: string;
  type: string;
  avantosType?: string;
}

// Dependency classification
export interface DependencyInfo {
  direct: FormNode[];
  transitive: FormNode[];
}

