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

### Environment Configuration

Create a `.env` file in the project root to configure the API URL:

```bash
# API base URL (defaults to http://localhost:3000)
VITE_API_BASE_URL=http://localhost:3000
```

For production deployments, set `VITE_API_BASE_URL` to your API server's URL.

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

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │   FormList      │  │           PrefillPanel              │   │
│  │   (sidebar)     │  │  ┌─────────────────────────────┐    │   │
│  │                 │  │  │    DataSourceModal          │    │   │
│  │  • Shows forms  │  │  │    • Search/filter          │    │   │
│  │  • Sorted by    │  │  │    • Select mapping         │    │   │
│  │    dependency   │  │  └─────────────────────────────┘    │   │
│  └────────┬────────┘  └──────────────────┬──────────────────┘   │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          ▼                                       │
│                    useGraph hook                                 │
│                (state management)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌───────────┐    ┌────────────────┐
    │ dagUtils │    │ graphSvc  │    │ DataSource     │
    │          │    │           │    │ Registry       │
    │ • topoSort│   │ • fetch   │    │                │
    │ • getDeps │   │ • update  │    │ • Providers    │
    └──────────┘    └───────────┘    └────────────────┘
```

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

#### 5. Component Conventions

| Convention | Example | Why |
|------------|---------|-----|
| Named exports only | `export const Button = ...` | Consistent naming, better refactoring |
| Props suffix | `interface ButtonProps` | Clear purpose identification |
| `handle` for handlers | `handleClick`, `handleSubmit` | Distinguishes internal handlers from props |
| `on` for event props | `onClick`, `onSelect` | Standard React convention |
| `use` prefix for hooks | `useGraph`, `useNodeFields` | Required by React rules of hooks |

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

The codebase includes **113 tests** across 8 test files:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `DataSourceProvider.test.ts` | 7 | Registry operations, provider sorting |
| `FormFieldsProvider.test.ts` | 10 | Direct/transitive dependency providers |
| `GlobalDataProvider.test.ts` | 9 | Global data configuration |
| `dagUtils.test.ts` | 16 | DAG traversal algorithms |
| `useGraph.test.tsx` | 20 | Graph hook state management |
| `FormList.test.tsx` | 9 | Form list component rendering |
| `PrefillPanel.test.tsx` | 17 | Prefill panel interactions |
| `DataSourceModal.test.tsx` | 25 | Modal search, selection, accessibility |

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm test

# Run with coverage report
npm run test:coverage
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
