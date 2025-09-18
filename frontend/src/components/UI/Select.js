import React, { useEffect, useMemo, useRef, useState } from 'react';
import './select.css';

/**
 * Themed Select component
 * Props:
 * - value: string | undefined
 * - options: string[]
 * - onChange: (value: string) => void
 * - placeholder?: string
 * - disabled?: boolean
 * - className?: string (optional, to inherit node-card__input spacing if desired)
 */
export default function Select({ value, options = [], onChange, placeholder = 'Select…', disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapRef = useRef(null);
  const listboxId = useMemo(() => `vs-select-listbox-${Math.random().toString(36).slice(2, 8)}` , []);

  const currentLabel = value ?? '';

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard navigation
  function onKeyDown(e) {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex(Math.max(0, options.findIndex((o) => o === value)));
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => {
        const next = (i + 1) % options.length;
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => {
        const next = i <= 0 ? options.length - 1 : i - 1;
        return next;
      });
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHighlightIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHighlightIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[highlightIndex];
      if (opt != null) {
        onChange(opt);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setHighlightIndex(-1);
    }
  }

  function toggleOpen(e) {
    if (disabled) return;
    // Avoid dragging the React Flow node when clicking the control
    e.preventDefault();
    e.stopPropagation();
    setOpen((o) => !o);
  }

  function handleOptionClick(e, opt) {
    e.preventDefault();
    e.stopPropagation();
    onChange(opt);
    setOpen(false);
  }

  return (
    <div
      className={`vs-select ${disabled ? 'is-disabled' : ''}`}
      ref={wrapRef}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        // Prevent React Flow from treating this as a drag start
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        className={`vs-select__control ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={toggleOpen}
      >
        <span className={`vs-select__value ${!currentLabel ? 'is-placeholder' : ''}`}>
          {currentLabel || placeholder}
        </span>
        <span className="vs-select__chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="vs-select__menu" role="listbox" id={listboxId}>
          {options.map((opt, idx) => {
            const selected = opt === value;
            const highlighted = idx === highlightIndex;
            return (
              <div
                key={`${opt}-${idx}`}
                role="option"
                aria-selected={selected}
                className={`vs-select__option ${selected ? 'is-selected' : ''} ${highlighted ? 'is-highlighted' : ''}`}
                onMouseDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => handleOptionClick(e, opt)}
                onMouseEnter={() => setHighlightIndex(idx)}
              >
                <span className="vs-select__option-label">{opt}</span>
                {selected ? <span className="vs-select__check" aria-hidden="true" /> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
