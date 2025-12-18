/**
 * Tests for the PrefillPanel component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrefillPanel } from './PrefillPanel';
import type { FormNode, BlueprintGraph, FormDefinition } from '../shared/types';

// Test fixtures
const createMockFormDefinition = (id: string): FormDefinition => ({
  id,
  name: 'Test Form',
  description: 'Test Description',
  is_reusable: false,
  field_schema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        title: 'Email Address',
        avantos_type: 'short-text',
      },
      name: {
        type: 'string',
        title: 'Full Name',
        avantos_type: 'short-text',
      },
      phone: {
        type: 'string',
        title: 'Phone Number',
        avantos_type: 'phone',
      },
    },
  },
  ui_schema: { type: 'VerticalLayout', elements: [] },
});

const createMockNode = (
  id: string = 'test-node',
  inputMapping: Record<string, unknown> = {}
): FormNode => ({
  id,
  type: 'form',
  position: { x: 0, y: 0 },
  data: {
    id: `data-${id}`,
    component_key: id,
    component_type: 'form',
    component_id: 'form-def-1',
    name: 'Test Form',
    prerequisites: ['prereq-1'],
    permitted_roles: [],
    input_mapping: inputMapping,
    sla_duration: { number: 0, unit: 'minutes' },
    approval_required: false,
    approval_roles: [],
  },
});

const createMockGraph = (
  nodes: FormNode[] = [],
  forms: FormDefinition[] = []
): BlueprintGraph => ({
  $schema: 'test',
  id: 'bp-1',
  tenant_id: '1',
  name: 'Test Blueprint',
  description: 'Test',
  category: 'Test',
  nodes,
  edges: [],
  forms,
  branches: [],
  triggers: [],
});

describe('PrefillPanel', () => {
  const mockOnUpdateMapping = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPanel = (
    node: FormNode,
    graph: BlueprintGraph,
    onUpdateMapping = mockOnUpdateMapping
  ) => {
    return render(
      <PrefillPanel
        node={node}
        graph={graph}
        onUpdateMapping={onUpdateMapping}
      />
    );
  };

  describe('rendering', () => {
    it('renders the panel header', () => {
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      expect(screen.getByText('Prefill')).toBeInTheDocument();
      expect(screen.getByText('Prefill fields for this form')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
    });

    it('renders prefill toggle', () => {
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('shows empty state when no fields available', () => {
      const node = createMockNode();
      node.data.component_id = 'non-existent-form';
      const graph = createMockGraph([node], []);

      renderPanel(node, graph);

      expect(screen.getByText('No fields available for prefill')).toBeInTheDocument();
    });
  });

  describe('mapped fields', () => {
    it('displays mapped field source', () => {
      const sourceNode = createMockNode('source-node');
      sourceNode.data.name = 'Source Form';
      
      const targetNode = createMockNode('target-node', {
        email: {
          type: 'form_field',
          sourceFormId: 'source-node',
          sourceFieldId: 'contact_email',
        },
      });
      targetNode.data.prerequisites = ['source-node'];

      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([sourceNode, targetNode], [formDef]);

      renderPanel(targetNode, graph);

      expect(screen.getByText('Email Address:')).toBeInTheDocument();
      expect(screen.getByText('Source Form.contact_email')).toBeInTheDocument();
    });

    it('shows clear button for mapped fields', () => {
      const targetNode = createMockNode('target-node', {
        email: {
          type: 'form_field',
          sourceFormId: 'source-node',
          sourceFieldId: 'contact_email',
        },
      });

      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([targetNode], [formDef]);

      renderPanel(targetNode, graph);

      const clearButtons = screen.getAllByTitle('Clear prefill');
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('calls onUpdateMapping with null when clearing mapping', async () => {
      const user = userEvent.setup();
      const targetNode = createMockNode('target-node', {
        email: {
          type: 'form_field',
          sourceFormId: 'source-node',
          sourceFieldId: 'contact_email',
        },
      });

      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([targetNode], [formDef]);

      renderPanel(targetNode, graph);

      const clearButton = screen.getAllByTitle('Clear prefill')[0];
      await user.click(clearButton);

      expect(mockOnUpdateMapping).toHaveBeenCalledWith(
        'target-node',
        'email',
        null
      );
    });
  });

  describe('unmapped fields', () => {
    it('shows add button for unmapped fields', () => {
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      const addButtons = screen.getAllByTitle('Configure prefill');
      expect(addButtons).toHaveLength(3); // All 3 fields are unmapped
    });

    it('opens modal when clicking unmapped field', async () => {
      const user = userEvent.setup();
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      // Click the field button (not the + button)
      const fieldButton = screen.getByText('Email Address').closest('button');
      await user.click(fieldButton!);

      // Modal should open (it shows "Select data element to map")
      expect(screen.getByText('Select data element to map')).toBeInTheDocument();
    });

    it('opens modal when clicking add button', async () => {
      const user = userEvent.setup();
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      const addButtons = screen.getAllByTitle('Configure prefill');
      await user.click(addButtons[0]);

      expect(screen.getByText('Select data element to map')).toBeInTheDocument();
    });
  });

  describe('prefill toggle', () => {
    it('hides fields when prefill is disabled', async () => {
      const user = userEvent.setup();
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      expect(screen.getByText('Email Address')).toBeInTheDocument();

      const toggle = screen.getByRole('checkbox');
      await user.click(toggle);

      expect(screen.queryByText('Email Address')).not.toBeInTheDocument();
    });

    it('shows fields when prefill is re-enabled', async () => {
      const user = userEvent.setup();
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      const toggle = screen.getByRole('checkbox');
      
      // Disable
      await user.click(toggle);
      expect(screen.queryByText('Email Address')).not.toBeInTheDocument();
      
      // Re-enable
      await user.click(toggle);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });
  });

  describe('global data mappings', () => {
    it('displays global data source path', () => {
      const targetNode = createMockNode('target-node', {
        email: {
          type: 'global',
          sourceFieldId: 'user_email',
          sourcePath: 'user-context.user_email',
        },
      });

      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([targetNode], [formDef]);

      renderPanel(targetNode, graph);

      expect(screen.getByText('user-context.user_email')).toBeInTheDocument();
    });

    it('falls back to sourceFieldId when no path', () => {
      const targetNode = createMockNode('target-node', {
        email: {
          type: 'global',
          sourceFieldId: 'user_email',
        },
      });

      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([targetNode], [formDef]);

      renderPanel(targetNode, graph);

      expect(screen.getByText('user_email')).toBeInTheDocument();
    });
  });

  describe('modal interactions', () => {
    it('closes modal on cancel', async () => {
      const user = userEvent.setup();
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      // Open modal
      const addButton = screen.getAllByTitle('Configure prefill')[0];
      await user.click(addButton);
      expect(screen.getByText('Select data element to map')).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByRole('button', { name: 'CANCEL' }));
      expect(screen.queryByText('Select data element to map')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies mapped style to fields with mapping', () => {
      const targetNode = createMockNode('target-node', {
        email: {
          type: 'form_field',
          sourceFormId: 'source-node',
          sourceFieldId: 'contact_email',
        },
      });

      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([targetNode], [formDef]);

      renderPanel(targetNode, graph);

      // Find the mapped field item (CSS modules hash class names)
      const mappedField = screen.getByText('Email Address:').closest('[class*="fieldItem"]');
      expect(mappedField?.className).toMatch(/mapped/);
    });

    it('applies unmapped style to fields without mapping', () => {
      const node = createMockNode();
      const formDef = createMockFormDefinition('form-def-1');
      const graph = createMockGraph([node], [formDef]);

      renderPanel(node, graph);

      // All fields should have unmapped class
      const unmappedFields = document.querySelectorAll('[class*="unmapped"]');
      expect(unmappedFields.length).toBe(3);
    });
  });
});

