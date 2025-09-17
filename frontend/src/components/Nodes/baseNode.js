// baseNode.js
// A factory to create React Flow node components from a configuration object
// Config shape:
// {
//   type: string,
//   title: string,
//   fields: Array<{ name: string, label: string, type: 'text'|'textarea'|'number'|'select'|'toggle', default?: any, placeholder?: string, options?: string[] }>,
//   inputs: Array<{ id: string, label?: string }>,
//   outputs: Array<{ id: string, label?: string }>,
//   style?: React.CSSProperties
// }

import React, { useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../../store/store';
import './nodes-common.css';

function useStoreActions() {
  const updateNodeField = useStore((s) => s.updateNodeField);
  return { updateNodeField };
}

function FieldControl({ id, data, field, onChange }) {
  const value = data?.[field.name] ?? field.default ?? '';
  const commonProps = {
    className: 'node-card__input',
    value,
    placeholder: field.placeholder,
    onChange: (e) => onChange(id, field.name, e.target.type === 'number' ? Number(e.target.value) : e.target.value)
  };

  if (field.type === 'textarea') {
    return <textarea {...commonProps} rows={3} />;
  }
  if (field.type === 'number') {
    return <input type="number" {...commonProps} />;
  }
  if (field.type === 'select') {
    return (
      <select className="node-card__input" value={value} onChange={(e) => onChange(id, field.name, e.target.value)}>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'toggle') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(id, field.name, e.target.checked)}
      />
    );
  }
  // default to text
  return <input type="text" {...commonProps} />;
}

export function makeNode(config) {
  const NodeComponent = function GenericNode({ id, data }) {
    const { updateNodeField } = useStoreActions();

    // evenly distribute handles
    const inputPositions = useMemo(() => {
      const inputs = config.inputs || [];
      const n = inputs.length || 0;
      return inputs.map((h, i) => ({ ...h, top: `${((i + 1) * 100) / (n + 1)}%` }));
    }, []);

    const outputPositions = useMemo(() => {
      const outputs = config.outputs || [];
      const n = outputs.length || 0;
      return outputs.map((h, i) => ({ ...h, top: `${((i + 1) * 100) / (n + 1)}%` }));
    }, []);

    const onChange = (nodeId, fieldName, fieldValue) => {
      updateNodeField(nodeId, fieldName, fieldValue);
    };

    return (
      <div className="node-card" style={config.style || {}}>
        {/* Handles (targets) on the left */}
        {inputPositions.map((h) => (
          <Handle
            key={`in-${h.id}`}
            type="target"
            position={Position.Left}
            id={`${id}-${h.id}`}
            style={{ top: h.top }}
          />
        ))}

        {/* Header */}
        <div className="node-card__header">{config.title || config.type}</div>

        {/* Fields */}
        {(config.fields || []).map((field) => (
          <div key={field.name}>
            <label className="node-card__field-label">{field.label || field.name}</label>
            <FieldControl id={id} data={data} field={field} onChange={onChange} />
          </div>
        ))}

        {/* Handles (sources) on the right */}
        {outputPositions.map((h) => (
          <Handle
            key={`out-${h.id}`}
            type="source"
            position={Position.Right}
            id={`${id}-${h.id}`}
            style={{ top: h.top }}
          />
        ))}
      </div>
    );
  };

  NodeComponent.displayName = `${config.title || config.type}Node`;
  return NodeComponent;
}

export default makeNode;
