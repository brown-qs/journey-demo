/**
 * DataSourceModal component - Modal for selecting data sources to map to a field.
 * Shows available data from direct dependencies, transitive dependencies, and global data.
 */
import { useState, useMemo } from 'react';
import { X, Search, ChevronRight, ChevronDown, FileText, Globe, Check } from 'lucide-react';
import type { FormNode, BlueprintGraph, PrefillMapping } from '../shared/types';
import { dataSourceRegistry } from '../dataSources';
import type { DataSourceItem } from '../dataSources';
import styles from './DataSourceModal.module.css';

interface DataSourceModalProps {
  node: FormNode;
  graph: BlueprintGraph;
  fieldId: string;
  fieldName: string;
  onSelect: (mapping: PrefillMapping) => void;
  onClose: () => void;
}

export const DataSourceModal = ({
  node,
  graph,
  fieldId: _fieldId,
  fieldName,
  onSelect,
  onClose,
}: DataSourceModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<DataSourceItem | null>(null);

  // Get all available data sources
  const dataSources = useMemo(() => {
    return dataSourceRegistry.getAllDataSources(node, graph);
  }, [node, graph]);

  // Filter data sources by search query
  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return dataSources;

    const query = searchQuery.toLowerCase();
    return dataSources
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.fieldName.toLowerCase().includes(query) ||
            item.sourceName.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [dataSources, searchQuery]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleSelect = () => {
    if (!selectedItem) return;

    const mapping: PrefillMapping = {
      type: selectedItem.type,
      sourceFieldId: selectedItem.fieldId,
      ...(selectedItem.type === 'form_field' && {
        sourceFormId: selectedItem.sourceId,
      }),
      ...(selectedItem.path && { sourcePath: selectedItem.path }),
    };

    onSelect(mapping);
  };

  const getGroupIcon = (type: string) => {
    return type === 'form' ? <FileText size={16} /> : <Globe size={16} />;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            Select data element to map
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.targetInfo}>
          <span className={styles.targetLabel}>Mapping to:</span>
          <span className={styles.targetField}>{fieldName}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.searchSection}>
            <div className={styles.searchLabel}>Available data</div>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className={styles.sourceList}>
            {filteredSources.length === 0 ? (
              <div className={styles.emptyState}>
                No matching data sources found
              </div>
            ) : (
              filteredSources.map((group) => (
                <div key={group.id} className={styles.sourceGroup}>
                  <button
                    className={styles.groupHeader}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={expandedGroups.has(group.id)}
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <span className={styles.groupIcon}>
                      {getGroupIcon(group.type)}
                    </span>
                    <span className={styles.groupName}>{group.name}</span>
                    {group.description && (
                      <span className={styles.groupBadge}>{group.description}</span>
                    )}
                  </button>

                  {expandedGroups.has(group.id) && (
                    <div className={styles.groupItems}>
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          className={`${styles.sourceItem} ${
                            selectedItem?.id === item.id ? styles.selected : ''
                          }`}
                          onClick={() => setSelectedItem(item)}
                        >
                          <span className={styles.itemName}>{item.fieldName}</span>
                          {item.fieldType && (
                            <span className={styles.itemType}>{item.fieldType}</span>
                          )}
                          {selectedItem?.id === item.id && (
                            <Check size={14} className={styles.checkIcon} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            CANCEL
          </button>
          <button
            className={styles.selectButton}
            onClick={handleSelect}
            disabled={!selectedItem}
          >
            SELECT
          </button>
        </div>
      </div>
    </div>
  );
};

