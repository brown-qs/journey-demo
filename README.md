# Journey Builder Demo

A React application for configuring prefill mappings between form fields in a workflow builder. This demo showcases a clean, extensible architecture for managing data sources that can populate form fields.

## Features

- 📋 **Form Dependency Visualization**: View forms in a blueprint sorted by their dependency order
- 🔗 **Prefill Configuration**: Map form fields to data from:
  - Direct dependency forms
  - Transitive dependency forms
  - Global data sources (action properties, user context, etc.)
- 🔌 **Extensible Architecture**: Easily add new data source providers
- ✅ **Type-Safe**: Full TypeScript support with comprehensive types

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install frontend dependencies
npm install

# Install mock server dependencies
cd mock-server && npm install
```

### Running Locally

You need to run both the mock server and the frontend:

**Terminal 1 - Start the mock server:**
```bash
cd mock-server
npm start
# Server runs on http://localhost:3000
```

**Terminal 2 - Start the frontend:**
```bash
npm run dev
# App runs on http://localhost:5173
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

---

## Architecture

### Project Structure

```
src/
├── components/           # Shared UI components
│   └── FormList.tsx     # Form list sidebar
├── dataSources/         # Data source provider system
│   ├── DataSourceProvider.ts     # Core interfaces & registry
│   ├── FormFieldsProvider.ts     # Form field providers
│   ├── GlobalDataProvider.ts     # Global data provider
│   └── index.ts                  # Module exports & registration
├── graph/               # Graph/DAG utilities
│   ├── dagUtils.ts      # DAG traversal algorithms
│   ├── graphService.ts  # API service
│   └── useGraph.ts      # React hook for graph state
├── prefill/             # Prefill configuration UI
│   ├── PrefillPanel.tsx # Field mapping panel
│   └── DataSourceModal.tsx # Data source selection modal
├── shared/              # Shared utilities & types
│   ├── types.ts         # TypeScript type definitions
│   └── BaseError.ts     # Error classes
└── App.tsx              # Main application component
```

### Key Patterns

#### 1. Feature-Based Organization

Code is organized by feature (`dataSources/`, `prefill/`, `graph/`) rather than by file type. Each feature is self-contained with its components, hooks, and utilities.

#### 2. Data Source Provider Pattern (Strategy Pattern)

The data source system uses the Strategy pattern for extensibility:

```typescript
interface DataSourceProvider {
  id: string;
  name: string;
  priority: number;
  isApplicable(node: FormNode, graph: BlueprintGraph): boolean;
  getDataSources(node: FormNode, graph: BlueprintGraph): DataSourceGroup[];
}
```

Providers are registered with a central registry and automatically appear in the UI.

#### 3. Result Type Error Handling

The codebase uses [neverthrow](https://github.com/supermacro/neverthrow) for type-safe error handling:

```typescript
// Services return Result types
fetchBlueprintGraph(): ResultAsync<BlueprintGraph, ApiError | NetworkError>

// Callers handle both success and error cases
result
  .map(data => handleSuccess(data))
  .mapErr(error => handleError(error));
```

#### 4. DAG Utilities

The `dagUtils` module provides algorithms for traversing the form dependency graph:
- `getDirectDependencies`: Forms this form immediately depends on
- `getTransitiveDependencies`: Indirect dependencies (dependencies of dependencies)
- `topologicalSort`: Order forms so dependencies come first

---

## Extending with New Data Sources

Adding a new data source is straightforward:

### Step 1: Create a Provider Class

```typescript
// src/dataSources/MyCustomProvider.ts
import type { DataSourceProvider, DataSourceGroup } from './DataSourceProvider';
import type { FormNode, BlueprintGraph } from '../shared/types';

export class MyCustomProvider implements DataSourceProvider {
  id = 'my-custom-provider';
  name = 'My Custom Data';
  priority = 40;  // Lower = higher in the list

  isApplicable(node: FormNode, graph: BlueprintGraph): boolean {
    // Return true if this provider should be available
    // for the selected node
    return true;
  }

  getDataSources(node: FormNode, graph: BlueprintGraph): DataSourceGroup[] {
    return [{
      id: 'my-group',
      name: 'My Data Group',
      type: 'global',  // 'global' or 'form'
      items: [{
        id: 'my-item-1',
        label: 'My Item',
        type: 'global',
        sourceId: 'my-source',
        sourceName: 'My Source',
        fieldId: 'my-field',
        fieldName: 'My Field',
        fieldType: 'string',
      }],
    }];
  }
}
```

### Step 2: Register the Provider

```typescript
// In src/dataSources/index.ts
import { dataSourceRegistry } from './DataSourceProvider';
import { MyCustomProvider } from './MyCustomProvider';

dataSourceRegistry.register(new MyCustomProvider());
```

That's it! Your new data source will automatically appear in the prefill modal.

### Provider Interface Details

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the provider |
| `name` | `string` | Display name shown in the UI |
| `priority` | `number` | Sort order (lower = higher priority) |
| `isApplicable()` | `boolean` | Whether to show for current node |
| `getDataSources()` | `DataSourceGroup[]` | Available data items |

### Adding Global Data Sources (Simpler Approach)

For simple global data, you can extend the existing `GlobalDataProvider`:

```typescript
import { GlobalDataProvider } from './dataSources';

const provider = new GlobalDataProvider();
provider.addSource({
  id: 'my-api-data',
  name: 'External API Data',
  description: 'Data from external API',
  fields: [
    { id: 'api_value_1', name: 'API Value 1', type: 'string' },
    { id: 'api_value_2', name: 'API Value 2', type: 'number' },
  ],
});
```

---

## API

The app expects a mock server running on `http://localhost:3000` with this endpoint:

```
GET /api/v1/{tenant_id}/actions/blueprints/{blueprint_id}/graph
```

Returns a `BlueprintGraph` object containing:
- `nodes`: Form nodes with their dependencies
- `edges`: Connections between nodes
- `forms`: Form definitions with field schemas

See `mock-server/graph.json` for the complete data structure.

---

## Testing

The codebase includes comprehensive tests:

| Test File | Coverage |
|-----------|----------|
| `DataSourceProvider.test.ts` | Registry operations, provider sorting |
| `FormFieldsProvider.test.ts` | Direct/transitive dependency providers |
| `GlobalDataProvider.test.ts` | Global data configuration |
| `dagUtils.test.ts` | DAG traversal algorithms |
| `FormList.test.tsx` | Form list component |
| `DataSourceModal.test.tsx` | Modal interactions |

Run all tests:
```bash
npm run test:run
```

---

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Test runner
- **Testing Library** - Component testing
- **neverthrow** - Type-safe error handling
- **lucide-react** - Icons

---

## License

MIT
