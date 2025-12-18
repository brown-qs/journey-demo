/**
 * Tests for the DataSourceModal component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSourceModal } from './DataSourceModal';
import { dataSourceRegistry, DataSourceRegistry } from '../dataSources';
import type { DataSourceProvider, DataSourceGroup } from '../dataSources';
import type { FormNode, BlueprintGraph } from '../shared/types';

// Mock the dataSourceRegistry
vi.mock('../dataSources', async () => {
  const actual = await vi.importActual('../dataSources');
  return {
    ...actual,
    dataSourceRegistry: {
      getAllDataSources: vi.fn(),
    },
  };
});

// Test fixtures
const createMockNode = (
  id: string = 'test-node',
  prerequisites: string[] = []
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
    prerequisites,
    permitted_roles: [],
    input_mapping: {},
    sla_duration: { number: 0, unit: 'minutes' },
    approval_required: false,
    approval_roles: [],
  },
});

const createMockGraph = (): BlueprintGraph => ({
  $schema: 'test',
  id: 'bp-1',
  tenant_id: '1',
  name: 'Test Blueprint',
  description: 'Test',
  category: 'Test',
  nodes: [],
  edges: [],
  forms: [],
  branches: [],
  triggers: [],
});

const mockDataSources: DataSourceGroup[] = [
  {
    id: 'form-dependency-1',
    name: 'Previous Form',
    type: 'form',
    description: 'Direct dependency',
    items: [
      {
        id: 'dep1:email',
        label: 'Previous Form.Email',
        type: 'form_field',
        sourceId: 'dependency-1',
        sourceName: 'Previous Form',
        fieldId: 'email',
        fieldName: 'Email Address',
        fieldType: 'email',
      },
      {
        id: 'dep1:name',
        label: 'Previous Form.Name',
        type: 'form_field',
        sourceId: 'dependency-1',
        sourceName: 'Previous Form',
        fieldId: 'name',
        fieldName: 'Full Name',
        fieldType: 'string',
      },
    ],
  },
  {
    id: 'global-action',
    name: 'Action Properties',
    type: 'global',
    description: 'Workflow data',
    items: [
      {
        id: 'action:id',
        label: 'Action Properties.Action ID',
        type: 'global',
        sourceId: 'action-properties',
        sourceName: 'Action Properties',
        fieldId: 'action_id',
        fieldName: 'Action ID',
        fieldType: 'string',
      },
    ],
  },
];

describe('DataSourceModal', () => {
  const mockNode = createMockNode();
  const mockGraph = createMockGraph();
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataSourceRegistry.getAllDataSources).mockReturnValue(mockDataSources);
  });

  const renderModal = (props = {}) => {
    return render(
      <DataSourceModal
        node={mockNode}
        graph={mockGraph}
        fieldId="target-field"
        fieldName="Target Field"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        {...props}
      />
    );
  };

  describe('rendering', () => {
    it('renders the modal with title', () => {
      renderModal();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Select data element to map')).toBeInTheDocument();
    });

    it('displays the target field name', () => {
      renderModal({ fieldName: 'Customer Email' });

      expect(screen.getByText('Mapping to:')).toBeInTheDocument();
      expect(screen.getByText('Customer Email')).toBeInTheDocument();
    });

    it('renders all data source groups', () => {
      renderModal();

      expect(screen.getByText('Previous Form')).toBeInTheDocument();
      expect(screen.getByText('Action Properties')).toBeInTheDocument();
    });

    it('displays group descriptions as badges', () => {
      renderModal();

      expect(screen.getByText('Direct dependency')).toBeInTheDocument();
      expect(screen.getByText('Workflow data')).toBeInTheDocument();
    });

    it('renders search input', () => {
      renderModal();

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
  });

  describe('group expansion', () => {
    it('expands group when header is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      const groupHeader = screen.getByText('Previous Form').closest('button');
      await user.click(groupHeader!);

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
    });

    it('collapses expanded group when clicked again', async () => {
      const user = userEvent.setup();
      renderModal();

      const groupHeader = screen.getByText('Previous Form').closest('button');
      
      // Expand
      await user.click(groupHeader!);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      
      // Collapse
      await user.click(groupHeader!);
      expect(screen.queryByText('Email Address')).not.toBeInTheDocument();
    });

    it('can expand multiple groups', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Previous Form').closest('button')!);
      await user.click(screen.getByText('Action Properties').closest('button')!);

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Action ID')).toBeInTheDocument();
    });
  });

  describe('search filtering', () => {
    it('filters items by field name', async () => {
      const user = userEvent.setup();
      renderModal();

      // Expand groups first
      await user.click(screen.getByText('Previous Form').closest('button')!);
      
      // Search for "email"
      await user.type(screen.getByPlaceholderText('Search...'), 'email');

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.queryByText('Full Name')).not.toBeInTheDocument();
    });

    it('filters items by source name', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.type(screen.getByPlaceholderText('Search...'), 'Action');

      // Only Action Properties group should be visible
      expect(screen.getByText('Action Properties')).toBeInTheDocument();
      expect(screen.queryByText('Previous Form')).not.toBeInTheDocument();
    });

    it('shows empty state when no matches', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.type(screen.getByPlaceholderText('Search...'), 'nonexistent');

      expect(screen.getByText('No matching data sources found')).toBeInTheDocument();
    });

    it('clears filter when search is cleared', async () => {
      const user = userEvent.setup();
      renderModal();

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'email');
      await user.clear(searchInput);

      expect(screen.getByText('Previous Form')).toBeInTheDocument();
      expect(screen.getByText('Action Properties')).toBeInTheDocument();
    });
  });

  describe('item selection', () => {
    it('selects item when clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Previous Form').closest('button')!);
      await user.click(screen.getByText('Email Address'));

      // Item should be visually selected (CSS modules hash class names)
      const emailItem = screen.getByText('Email Address').closest('button');
      expect(emailItem?.className).toMatch(/selected/);
    });

    it('enables SELECT button when item is selected', async () => {
      const user = userEvent.setup();
      renderModal();

      const selectButton = screen.getByRole('button', { name: 'SELECT' });
      expect(selectButton).toBeDisabled();

      await user.click(screen.getByText('Previous Form').closest('button')!);
      await user.click(screen.getByText('Email Address'));

      expect(selectButton).not.toBeDisabled();
    });

    it('calls onSelect with correct mapping for form field', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Previous Form').closest('button')!);
      await user.click(screen.getByText('Email Address'));
      await user.click(screen.getByRole('button', { name: 'SELECT' }));

      expect(mockOnSelect).toHaveBeenCalledWith({
        type: 'form_field',
        sourceFormId: 'dependency-1',
        sourceFieldId: 'email',
      });
    });

    it('calls onSelect with correct mapping for global data', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Action Properties').closest('button')!);
      await user.click(screen.getByText('Action ID'));
      await user.click(screen.getByRole('button', { name: 'SELECT' }));

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'global',
          sourceFieldId: 'action_id',
        })
      );
    });

    it('can change selection', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Previous Form').closest('button')!);
      await user.click(screen.getByText('Email Address'));
      await user.click(screen.getByText('Full Name'));

      const emailItem = screen.getByText('Email Address').closest('button');
      const nameItem = screen.getByText('Full Name').closest('button');
      
      // CSS modules hash class names
      expect(emailItem?.className).not.toMatch(/selected/);
      expect(nameItem?.className).toMatch(/selected/);
    });
  });

  describe('modal controls', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByLabelText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when CANCEL button is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('button', { name: 'CANCEL' }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderModal();

      // Click the overlay (first child of container)
      const overlay = container.querySelector('[class*="overlay"]');
      await user.click(overlay!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close when modal content is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Available data'));

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no data sources available', () => {
      vi.mocked(dataSourceRegistry.getAllDataSources).mockReturnValue([]);
      renderModal();

      expect(screen.getByText('No matching data sources found')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible dialog role', () => {
      renderModal();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has labeled modal title', () => {
      renderModal();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('group headers have aria-expanded attribute', async () => {
      const user = userEvent.setup();
      renderModal();

      const groupHeader = screen.getByText('Previous Form').closest('button');
      expect(groupHeader).toHaveAttribute('aria-expanded', 'false');

      await user.click(groupHeader!);
      expect(groupHeader).toHaveAttribute('aria-expanded', 'true');
    });
  });
});

