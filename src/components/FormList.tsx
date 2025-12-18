/**
 * FormList component - Displays the list of forms in the blueprint.
 * Forms are sorted topologically to show dependencies correctly.
 */
import { FileText, ChevronRight, GitBranch } from 'lucide-react';
import type { FormNode, BlueprintGraph } from '../shared/types';
import { topologicalSort } from '../graph/dagUtils';
import styles from './FormList.module.css';

interface FormListProps {
  graph: BlueprintGraph;
  selectedNode: FormNode | null;
  onSelectNode: (node: FormNode) => void;
}

export const FormList = ({ graph, selectedNode, onSelectNode }: FormListProps) => {
  const sortedNodes = topologicalSort(graph.nodes);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <GitBranch size={20} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>{graph.name}</h2>
          <p className={styles.subtitle}>{graph.nodes.length} forms</p>
        </div>
      </div>

      <div className={styles.list}>
        {sortedNodes.map((node, index) => (
          <button
            key={node.id}
            className={`${styles.item} ${selectedNode?.id === node.id ? styles.selected : ''}`}
            onClick={() => onSelectNode(node)}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className={styles.itemIcon}>
              <FileText size={18} />
            </div>
            <div className={styles.itemContent}>
              <span className={styles.itemName}>{node.data.name}</span>
              {node.data.prerequisites.length > 0 && (
                <span className={styles.itemMeta}>
                  {node.data.prerequisites.length} prerequisite{node.data.prerequisites.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <ChevronRight size={16} className={styles.itemArrow} />
          </button>
        ))}
      </div>
    </div>
  );
};

