// resultToast.js
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './resultToast.css';

/**
 * ResultToast
 * Shows a bottom-left toast summarizing pipeline results.
 * Props:
 * - data: { num_nodes: number, num_edges: number, is_dag: boolean } | null
 * - onClose: () => void
 * - durationMs?: number (default 4000)
 */
export const ResultToast = ({ data, onClose, durationMs = 4000 }) => {
  // Ensure hooks are called unconditionally before any early return
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => onClose && onClose(), durationMs);
    return () => clearTimeout(t);
  }, [onClose, durationMs, data]);

  if (!data) return null;
  const { num_nodes, num_edges, is_dag } = data;

  const status = is_dag ? 'DAG' : 'Not a DAG';
  const statusClass = is_dag ? 'ok' : 'warn';

  const content = (
    <div className="toast-root" role="status" aria-live="polite">
      <div className={`toast-card toast-${statusClass}`}>
        <div className="toast-header">
          <div className="toast-title">Pipeline Summary</div>
          <button className="toast-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="toast-body">
          <div className="toast-row">
            <span className="toast-label">Nodes</span>
            <span className="toast-value">{num_nodes}</span>
          </div>
          <div className="toast-row">
            <span className="toast-label">Edges</span>
            <span className="toast-value">{num_edges}</span>
          </div>
          <div className="toast-row">
            <span className="toast-label">DAG</span>
            <span className={`toast-badge ${statusClass}`}>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
