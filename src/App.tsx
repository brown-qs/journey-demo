/**
 * Journey Builder - Main Application Component
 * 
 * This application allows users to view forms in a blueprint and configure
 * prefill mappings between form fields.
 */
import { Loader2, AlertCircle, RefreshCw, Workflow } from 'lucide-react';
import { useGraph } from './graph/useGraph';
import { FormList } from './components/FormList';
import { PrefillPanel } from './prefill/PrefillPanel';
import styles from './App.module.css';

// Initialize data source providers
import './dataSources';

export const App = () => {
  const { graph, isLoading, error, selectedNode, selectNode, updateMapping, refetch } = useGraph();

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingContent}>
          <Loader2 size={40} className={styles.spinner} />
          <h2>Loading Blueprint</h2>
          <p>Fetching form graph from server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorContent}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div className={styles.errorHelp}>
            <p>Unable to reach the API server. Please check your connection.</p>
          </div>
          <button className={styles.retryButton} onClick={refetch}>
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!graph) {
    return null;
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Workflow size={24} />
          <span>Journey Builder</span>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.blueprintName}>{graph.name}</span>
          <span className={styles.divider}>•</span>
          <span className={styles.category}>{graph.category}</span>
        </div>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <FormList
            graph={graph}
            selectedNode={selectedNode}
            onSelectNode={selectNode}
          />
        </aside>

        <section className={styles.content}>
          {selectedNode ? (
            <>
              <div className={styles.contentHeader}>
                <h1 className={styles.formTitle}>{selectedNode.data.name}</h1>
                <p className={styles.formId}>ID: {selectedNode.id}</p>
              </div>
              <div className={styles.contentBody}>
                <PrefillPanel
                  node={selectedNode}
                  graph={graph}
                  onUpdateMapping={updateMapping}
                />
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>
              <Workflow size={64} className={styles.placeholderIcon} />
              <h2>Select a Form</h2>
              <p>Choose a form from the list to configure its prefill mappings</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
