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
import { useStore } from '../store';

const baseCardStyle = {
  width: 240,
  minHeight: 100,
  border: '1px solid #1C2536',
  borderRadius: 8,
  background: '#0F172A',
  color: '#E5E7EB',
  padding: 10,
  boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
};

const headerStyle = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
  color: '#93C5FD'
};

const fieldLabelStyle = {
  display: 'block',
  fontSize: 12,
  marginTop: 6,
  marginBottom: 4,
  color: '#CBD5E1'
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #334155',
  background: '#111827',
  color: '#E5E7EB',
};

function useStoreActions() {
  const updateNodeField = useStore((s) => s.updateNodeField);
  return { updateNodeField };
}

function FieldControl({ id, data, field, onChange }) {
  const value = data?.[field.name] ?? field.default ?? '';
  const commonProps = {
    style: inputStyle,
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
      <select style={inputStyle} value={value} onChange={(e) => onChange(id, field.name, e.target.value)}>
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
      <div style={{ ...baseCardStyle, ...(config.style || {}) }}>
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
        <div style={headerStyle}>{config.title || config.type}</div>

        {/* Fields */}
        {(config.fields || []).map((field) => (
          <div key={field.name}>
            <label style={fieldLabelStyle}>{field.label || field.name}</label>
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
