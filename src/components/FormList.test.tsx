/**
 * Tests for the FormList component.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormList } from './FormList';
import type { FormNode, BlueprintGraph } from '../shared/types';

// Test fixtures
const createMockNode = (
  id: string,
  name: string,
  prerequisites: string[] = []
): FormNode => ({
  id,
  type: 'form',
  position: { x: 0, y: 0 },
  data: {
    id: `data-${id}`,
    component_key: id,
    component_type: 'form',
    component_id: `form-def-${id}`,
    name,
    prerequisites,
    permitted_roles: [],
    input_mapping: {},
    sla_duration: { number: 0, unit: 'minutes' },
    approval_required: false,
    approval_roles: [],
  },
});

const createMockGraph = (nodes: FormNode[]): BlueprintGraph => ({
  $schema: 'test',
  id: 'bp-1',
  tenant_id: '1',
  name: 'Test Blueprint',
  description: 'Test Description',
  category: 'Test',
  nodes,
  edges: [],
  forms: [],
  branches: [],
  triggers: [],
});

describe('FormList', () => {
  describe('rendering', () => {
    it('renders the blueprint name and form count', () => {
      const nodes = [
        createMockNode('node-a', 'Form A'),
        createMockNode('node-b', 'Form B', ['node-a']),
      ];
      const graph = createMockGraph(nodes);

      render(
        <FormList
          graph={graph}
          selectedNode={null}
          onSelectNode={vi.fn()}
        />
      );

      expect(screen.getByText('Test Blueprint')).toBeInTheDocument();
      expect(screen.getByText('2 forms')).toBeInTheDocument();
    });

    it('renders all form nodes', () => {
      const nodes = [
        createMockNode('node-a', 'Personal Information'),
        createMockNode('node-b', 'Contact Details', ['node-a']),
        createMockNode('node-c', 'Review', ['node-b']),
      ];
      const graph = createMockGraph(nodes);

      render(
        <FormList
          graph={graph}
          selectedNode={null}
          onSelectNode={vi.fn()}
        />
      );

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('shows prerequisite count for forms with dependencies', () => {
      const nodes = [
        createMockNode('node-a', 'Form A'),
        createMockNode('node-b', 'Form B', ['node-a']),
        createMockNode('node-c', 'Form C', ['node-a', 'node-b']),
      ];
      const graph = createMockGraph(nodes);

      render(
        <FormList
          graph={graph}
          selectedNode={null}
          onSelectNode={vi.fn()}
        />
      );

      expect(screen.getByText('1 prerequisite')).toBeInTheDocument();
      expect(screen.getByText('2 prerequisites')).toBeInTheDocument();
    });

    it('sorts forms topologically (dependencies before dependents)', () => {
      // Create nodes in wrong order
      const nodeC = createMockNode('node-c', 'Third Form', ['node-b']);
      const nodeA = createMockNode('node-a', 'First Form');
      const nodeB = createMockNode('node-b', 'Second Form', ['node-a']);
      const graph = createMockGraph([nodeC, nodeA, nodeB]);

      render(
        <FormList
          graph={graph}
          selectedNode={null}
          onSelectNode={vi.fn()}
        />
      );

      const items = screen.getAllByRole('button');
      const formNames = items.map((item) => item.textContent);

      // First Form should come before Second Form, which should come before Third Form
      const firstIndex = formNames.findIndex((name) => name?.includes('First Form'));
      const secondIndex = formNames.findIndex((name) => name?.includes('Second Form'));
      const thirdIndex = formNames.findIndex((name) => name?.includes('Third Form'));

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });
  });

  describe('selection', () => {
    it('calls onSelectNode when a form is clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      const nodes = [
        createMockNode('node-a', 'Form A'),
        createMockNode('node-b', 'Form B', ['node-a']),
      ];
      const graph = createMockGraph(nodes);

      render(
        <FormList
          graph={graph}
          selectedNode={null}
          onSelectNode={handleSelect}
        />
      );

      await user.click(screen.getByText('Form B'));

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'node-b' })
      );
    });

    it('highlights the selected form', () => {
      const nodes = [
        createMockNode('node-a', 'Form A'),
        createMockNode('node-b', 'Form B', ['node-a']),
      ];
      const graph = createMockGraph(nodes);
      const selectedNode = nodes[1];

      render(
        <FormList
          graph={graph}
          selectedNode={selectedNode}
          onSelectNode={vi.fn()}
        />
      );

      const formBButton = screen.getByText('Form B').closest('button');
      // CSS modules hash class names, so check for partial match
      expect(formBButton?.className).toMatch(/selected/);
    });

    it('does not highlight unselected forms', () => {
      const nodes = [
        createMockNode('node-a', 'Form A'),
        createMockNode('node-b', 'Form B', ['node-a']),
      ];
      const graph = createMockGraph(nodes);
      const selectedNode = nodes[1];

      render(
        <FormList
          graph={graph}
          selectedNode={selectedNode}
          onSelectNode={vi.fn()}
        />
      );

      const formAButton = screen.getByText('Form A').closest('button');
      expect(formAButton?.className).not.toMatch(/selected/);
    });
  });

  describe('edge cases', () => {
    it('handles empty node list', () => {
      const graph = createMockGraph([]);

      render(
        <FormList
          graph={graph}
          selectedNode={null}
          onSelectNode={vi.fn()}
        />
      );

      expect(screen.getByText('0 forms')).toBeInTheDocument();
    });

    it('handles single node', () => {
      const nodes = [createMockNode('node-a', 'Only Form')];
      const graph = createMockGraph(nodes);

      render(
        <FormList
          graph={graph}
          selectedNode={null}
          onSelectNode={vi.fn()}
        />
      );

      expect(screen.getByText('Only Form')).toBeInTheDocument();
      expect(screen.getByText('1 forms')).toBeInTheDocument();
    });
  });
});

