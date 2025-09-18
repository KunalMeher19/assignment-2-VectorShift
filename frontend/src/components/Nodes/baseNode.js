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

import React, { useMemo, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../../store/store';
import './node-styles/nodes-common.css';
import Select from '../UI/Select';

function useStoreActions() {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  return { updateNodeField, removeNode };
}

function AutoTextarea({ value, placeholder, onChange }) {
  const ref = useRef(null);
  const autosize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    autosize();
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={"node-card__input node-card__textarea"}
      value={value}
      placeholder={placeholder}
      rows={1}
      onInput={autosize}
      onChange={onChange}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}

function FieldControl({ id, data, field, onChange, nodeType, isNameUnique }) {
  const value = data?.[field.name] ?? field.default ?? '';
  const isInputNameField = nodeType === 'customInput' && field.name === 'inputName';
  const isDuplicate = isInputNameField && value && !isNameUnique(value, id);
  const getNextInputName = useStore((s) => s.getNextInputName);
  const commonProps = {
    className: `node-card__input${isDuplicate ? ' node-card__input--error' : ''}`,
    value,
    placeholder: field.placeholder,
    onChange: (e) => onChange(id, field.name, e.target.type === 'number' ? Number(e.target.value) : e.target.value)
  };

  if (field.type === 'textarea') {
    return <AutoTextarea value={value} placeholder={field.placeholder} onChange={commonProps.onChange} />;
  }
  if (field.type === 'number') {
    return <input type="number" {...commonProps} />;
  }
  if (field.type === 'select') {
    return (
      <Select
        className="node-card__input" /* keep spacing/look consistent with inputs */
        value={value}
        options={field.options || []}
        onChange={(val) => onChange(id, field.name, val)}
        placeholder={field.placeholder || 'Select…'}
      />
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
  const handleTextBlur = () => {
    if (!isInputNameField) return;
    const trimmed = (value ?? '').toString().trim();
    if (!trimmed) {
      const next = getNextInputName();
      onChange(id, field.name, next);
    }
  };

  return (
    <>
      <input type="text" {...commonProps} onBlur={handleTextBlur} />
      {isDuplicate ? (
        <div className="node-card__error-text">Name already in use</div>
      ) : null}
    </>
  );
}

export function makeNode(config) {
  const NodeComponent = function GenericNode({ id, data }) {
    const { updateNodeField, removeNode } = useStoreActions();
    const nodeType = config.type;
    const isNameUnique = useStore((s) => s.isInputNameUnique);

    // Build inputs: static + dynamic (based on data)
    const inputPositions = useMemo(() => {
      const staticInputs = config.inputs || [];
      const dynamicInputs = typeof config.getDynamicInputs === 'function' ? (config.getDynamicInputs(data) || []) : [];
      // merge while deduping by id
      const byId = new Map();
      [...staticInputs, ...dynamicInputs].forEach((h) => {
        if (!h || !h.id) return;
        byId.set(h.id, h);
      });
      const inputs = Array.from(byId.values());
      const n = inputs.length || 0;
      return inputs.map((h, i) => ({ ...h, top: `${((i + 1) * 100) / (n + 1)}%` }));
    }, [data]);

    const outputPositions = useMemo(() => {
      const outputs = config.outputs || [];
      const n = outputs.length || 0;
      return outputs.map((h, i) => ({ ...h, top: `${((i + 1) * 100) / (n + 1)}%` }));
    }, []);

    const onChange = (nodeId, fieldName, fieldValue) => {
      updateNodeField(nodeId, fieldName, fieldValue);
    };

    const handleDelete = () => {
      removeNode(id);
    };

    const dynamicStyle = typeof config.computeStyle === 'function' ? (config.computeStyle(data) || {}) : {};
    const className = ['node-card', config.className].filter(Boolean).join(' ');

    return (
      <div className={className} style={{ ...(config.style || {}), ...dynamicStyle }}>
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
        <div className="node-card__header">
          <div className="node-card__header-left">
            {config.icon ? (
              <img
                src={config.icon}
                alt=""
                className="node-card__icon"
                width={18}
                height={18}
                draggable={false}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <div className="node-card__title">{config.title || config.type}</div>
          </div>
          <button className="node-card__delete" onClick={handleDelete} title="Delete node" aria-label="Delete node">×</button>
        </div>

        {config.description ? (
          <div className="node-card__desc">{config.description}</div>
        ) : null}

        {/* Fields */}
        {(config.fields || []).map((field) => (
          <div key={field.name} className="node-card__field">
            <div className="node-card__field-top">
              <label className="node-card__field-label">{field.label || field.name}</label>
              {field.type === 'select' ? (
                <span className="node-card__badge">Dropdown</span>
              ) : null}
            </div>
            <FieldControl id={id} data={data} field={field} onChange={onChange} nodeType={nodeType} isNameUnique={isNameUnique} />
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
