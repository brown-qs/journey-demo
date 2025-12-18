/**
 * PrefillPanel component - Shows and manages prefill configuration for a form.
 * Displays the form's fields and their current prefill mappings.
 */
import { useState } from 'react';
import { Database, X, Plus, Settings2 } from 'lucide-react';
import type { FormNode, BlueprintGraph, PrefillMapping } from '../shared/types';
import { useNodeFields } from '../graph/useGraph';
import { DataSourceModal } from './DataSourceModal';
import styles from './PrefillPanel.module.css';

interface PrefillPanelProps {
  node: FormNode;
  graph: BlueprintGraph;
  onUpdateMapping: (
    nodeId: string,
    fieldId: string,
    mapping: PrefillMapping | null
  ) => void;
}

export const PrefillPanel = ({ node, graph, onUpdateMapping }: PrefillPanelProps) => {
  const fields = useNodeFields(node, graph);
  const [modalFieldId, setModalFieldId] = useState<string | null>(null);
  const [isPrefillEnabled, setIsPrefillEnabled] = useState(true);

  const mappings = node.data.input_mapping || {};

  const handleClearMapping = (fieldId: string) => {
    onUpdateMapping(node.id, fieldId, null);
  };

  const handleSelectMapping = (fieldId: string, mapping: PrefillMapping) => {
    onUpdateMapping(node.id, fieldId, mapping);
    setModalFieldId(null);
  };

  const getMappingDisplay = (fieldId: string): string | null => {
    const mapping = mappings[fieldId];
    if (!mapping) return null;

    if (mapping.type === 'form_field' && mapping.sourceFormId) {
      const sourceNode = graph.nodes.find((n) => n.id === mapping.sourceFormId);
      return sourceNode
        ? `${sourceNode.data.name}.${mapping.sourceFieldId}`
        : mapping.sourceFieldId;
    }

    return mapping.sourcePath || mapping.sourceFieldId;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>Prefill</h2>
          <p className={styles.subtitle}>Prefill fields for this form</p>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={isPrefillEnabled}
            onChange={(e) => setIsPrefillEnabled(e.target.checked)}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </label>
      </div>

      {isPrefillEnabled && (
        <div className={styles.fieldList}>
          {fields.length === 0 ? (
            <div className={styles.emptyState}>
              <Settings2 size={24} className={styles.emptyIcon} />
              <p>No fields available for prefill</p>
            </div>
          ) : (
            fields.map((field, index) => {
              const mappingDisplay = getMappingDisplay(field.id);
              const hasMapping = !!mappingDisplay;

              return (
                <div
                  key={field.id}
                  className={`${styles.fieldItem} ${hasMapping ? styles.mapped : styles.unmapped}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <button
                    className={styles.fieldButton}
                    onClick={() => !hasMapping && setModalFieldId(field.id)}
                    disabled={hasMapping}
                  >
                    <div className={styles.fieldIcon}>
                      <Database size={16} />
                    </div>
                    <div className={styles.fieldContent}>
                      <span className={styles.fieldName}>
                        {hasMapping ? (
                          <>
                            <span className={styles.targetField}>{field.name}:</span>
                            <span className={styles.sourceField}>{mappingDisplay}</span>
                          </>
                        ) : (
                          field.name
                        )}
                      </span>
                    </div>
                  </button>

                  {hasMapping ? (
                    <button
                      className={styles.clearButton}
                      onClick={() => handleClearMapping(field.id)}
                      title="Clear prefill"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <button
                      className={styles.addButton}
                      onClick={() => setModalFieldId(field.id)}
                      title="Configure prefill"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {modalFieldId && (
        <DataSourceModal
          node={node}
          graph={graph}
          fieldId={modalFieldId}
          fieldName={fields.find((f) => f.id === modalFieldId)?.name || modalFieldId}
          onSelect={(mapping) => handleSelectMapping(modalFieldId, mapping)}
          onClose={() => setModalFieldId(null)}
        />
      )}
    </div>
  );
};

