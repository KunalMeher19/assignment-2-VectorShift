import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '../../../store/store';
import '../node-styles/nodes-common.css';
const VAR_FULL = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

export default function TextPicker({ id, data, field, onChange }) {
    const inputVal = data?.[field.name] ?? '';
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [caret, setCaret] = useState(0);
    const [triggerStart, setTriggerStart] = useState(null);
    const textareaRef = useRef(null);
    const chipRowRef = useRef(null);
    const [chipPad, setChipPad] = useState(0);

    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);
    const addConnection = useStore((s) => s.addConnectionWithStyle);
    const removeEdge = useStore((s) => s.removeEdgeBetween);
    // regex lifted to module scope

    // Exclude any input node already connected to this Text node (any dynamic handle)
    const connectedSourceIds = useMemo(() => {
        const list = (edges || []).filter((e) => e?.target === id).map((e) => e.source);
        return Array.from(new Set(list));
    }, [edges, id]);

    const inputNodes = useMemo(
        () => (nodes || []).filter((n) => n.type === 'customInput' && !connectedSourceIds.includes(n.id)),
        [nodes, connectedSourceIds]
    );

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        const pos = Math.min(caret, String(inputVal).length);
        try { el.selectionStart = pos; el.selectionEnd = pos; } catch { }
    }, [show, caret, inputVal]);

    const autosize = () => {
        const el = textareaRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`;
    };
    useEffect(() => { autosize(); }, [inputVal]);

    const tokens = useMemo(() => {
        const result = [];
        const text = String(inputVal || '');
        let m;
        while ((m = VAR_FULL.exec(text)) !== null) {
            result.push({ name: m[1], type: m[2], start: m.index, end: m.index + m[0].length });
        }
        return result;
    }, [inputVal]);

    // Build a display string that hides token substrings, plus helpers for index mapping
    const prevDisplayRef = useRef('');
    const tokenSegments = useMemo(() => {
        const segments = [];
        const text = String(inputVal || '');
        const sorted = [...tokens].sort((a, b) => a.start - b.start);
        let cursor = 0;
        for (const t of sorted) {
            if (cursor < t.start) segments.push({ start: cursor, end: t.start });
            cursor = t.end;
        }
        if (cursor < text.length) segments.push({ start: cursor, end: text.length });
        return segments;
    }, [tokens, inputVal]);

    const displayValue = useMemo(() => {
        const text = String(inputVal || '');
        if (!tokens.length) return text;
        let out = '';
        tokenSegments.forEach((seg) => { out += text.slice(seg.start, seg.end); });
        return out;
    }, [inputVal, tokens, tokenSegments]);
    useEffect(() => { prevDisplayRef.current = displayValue; }, [displayValue]);

    const displayToOriginal = (di) => {
        let remaining = di;
        for (const seg of tokenSegments) {
            const segLen = seg.end - seg.start;
            if (remaining <= segLen) return seg.start + remaining;
            remaining -= segLen;
        }
        return String(inputVal || '').length;
    };

    useEffect(() => {
        const el = chipRowRef.current; if (!el) { setChipPad(0); return; }
        const h = el.getBoundingClientRect().height; setChipPad(tokens.length ? Math.ceil(h) + 6 : 0);
    }, [tokens]);

    const handleTextChange = (e) => {
        const newDisplay = e.target.value;
        const selectionStart = e.target.selectionStart ?? 0;
        // diff prev vs new display to compute inserted text and removed length
        const prev = prevDisplayRef.current;
        let p = 0;
        const minLen = Math.min(prev.length, newDisplay.length);
        while (p < minLen && prev[p] === newDisplay[p]) p++;
        let sPrev = prev.length - 1;
        let sNew = newDisplay.length - 1;
        while (sPrev >= p && sNew >= p && prev[sPrev] === newDisplay[sNew]) { sPrev--; sNew--; }
        const removedCount = (sPrev + 1) - p;
        const inserted = newDisplay.slice(p, sNew + 1);
        const origStart = displayToOriginal(p);
        const origEnd = displayToOriginal(p + removedCount);
        const orig = String(inputVal || '');
        const nextOrig = orig.slice(0, origStart) + inserted + orig.slice(origEnd);
        onChange(id, field.name, nextOrig);
        const newCaretOrig = origStart + inserted.length;
        setCaret(newCaretOrig);
        // Trigger popup if just typed '{{' (in display space)
        const leftDisp = newDisplay.slice(0, selectionStart);
        if (leftDisp.endsWith('{{')) {
            const braceStartOrig = displayToOriginal(selectionStart - 2);
            setTriggerStart(braceStartOrig);
            setShow(true);
            setStep(1);
            setSelectedNodeId(null);
        }
        // Close popup if initiating '{{' was removed
        if (show && step === 1 && typeof selectionStart === 'number') {
            const around = newDisplay.slice(Math.max(0, selectionStart - 2), selectionStart);
            if (!around.includes('{{')) {
                setShow(false);
                setTriggerStart(null);
            }
        }
    };

    const insertAtCaret = (text) => {
        const current = String(inputVal ?? '');
        const pos = caret ?? current.length;
        const next = current.slice(0, pos) + text + current.slice(pos);
        onChange(id, field.name, next);
        setTimeout(() => {
            const el = textareaRef.current; if (!el) return; const newPos = pos + text.length; el.focus(); try { el.setSelectionRange(newPos, newPos); } catch { } setCaret(newPos);
        }, 0);
    };

    const replaceDoubleBraceWith = (textAfter) => {
        const start = triggerStart ?? (caret - 2);
        const clampedStart = Math.max(0, start);
        const before = String(inputVal).slice(0, clampedStart);
        const after = String(inputVal).slice(clampedStart + 2);
        const next = before + '{{' + textAfter + after;
        onChange(id, field.name, next);
        const newPos = (before + '{{' + textAfter).length;
        setCaret(newPos);
        setTimeout(() => { const el = textareaRef.current; if (!el) return; try { el.setSelectionRange(newPos, newPos); } catch { } }, 0);
    };

    const handlePickNode = (n) => {
        setSelectedNodeId(n.id);
        const name = n?.data?.inputName || 'input_1';
        replaceDoubleBraceWith(`${name}`);
        setStep(2);
    };

    const typeOptionsFor = (n) => {
        const t = n?.data?.inputType || 'Text';
        if (t === 'File') return ['file'];
        return ['text'];
    };

    const handlePickType = (type) => {
        const n = nodes.find((x) => x.id === selectedNodeId);
        const name = n?.data?.inputName || 'input_1';
        insertAtCaret(`.${type}}}`);
        setShow(false); setStep(1); setSelectedNodeId(null); setTriggerStart(null);
        if (n) {
            // connect to dynamic input handle that will appear with id = variable name
            // allow a brief delay for the handle to be created after text update
            setTimeout(() => {
                addConnection({ source: n.id, sourceHandle: `${n.id}-value`, target: id, targetHandle: `${id}-${name}` });
            }, 0);
        }
    };

    const removeToken = (tok) => {
        const text = String(inputVal || '');
        const next = text.slice(0, tok.start) + text.slice(tok.end);
        onChange(id, field.name, next);
        setCaret(tok.start);
        const inputNode = (nodes || []).find((n) => (n.data?.inputName === tok.name) && n.type === 'customInput');
        if (inputNode) {
            removeEdge({ source: inputNode.id, sourceHandle: `${inputNode.id}-value`, target: id, targetHandle: `${id}-${tok.name}` });
        }
    };

    return (
        <div style={{ position: 'relative', display: "flex", flexDirection: "column" }}>
            <div ref={chipRowRef} style={{ position: 'absolute', top: 4, left: 8, right: 8, display: 'flex', flexWrap: 'wrap', gap: 6, pointerEvents: 'none', fontSize: 'xx-small' }}>
                {tokens.map((t, i) => (
                    <span key={`${t.name}.${t.type}.${i}`} className="token-chip" style={{ padding: '1px', fontSize: 11, pointerEvents: 'auto' }}>
                        <span className="token-chip__icon" style={{ width: 10, height: 10 }}>➜</span>
                        {t.name}.{t.type}
                        <button className="token-chip__remove" onClick={() => removeToken(t)} title="Remove" style={{ fontSize: 9, padding: 2 }}>×</button>
                    </span>
                ))}
            </div>
            <textarea
                ref={textareaRef}
                className={"node-card__input node-card__textarea"}
                value={displayValue}
                placeholder={tokens.length ? '' : field.placeholder}
                rows={1}
                onInput={autosize}
                onClick={(e) => setCaret(e.target.selectionStart ?? 0)}
                onKeyUp={(e) => setCaret(e.target.selectionStart ?? 0)}
                onChange={handleTextChange}
                style={{ overflow: 'hidden', resize: 'none', paddingTop: chipPad || undefined, whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}
            />
            {show ? (
                <div style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: 6, width: 200, background: 'linear-gradient(180deg, #ffffff, #f8fafc)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: '0 10px 20px rgba(2,6,23,0.18)' }}>
                    {step === 1 ? (
                        <div>
                            <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--color-muted)' }}>Step 1 • Nodes</div>
                            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                                {inputNodes.length === 0 ? (
                                    <div style={{ padding: 10, fontSize: 12, color: 'var(--color-muted)' }}>
                                        {(nodes || []).some((n) => n.type === 'customInput')
                                            ? 'All input nodes are already connected'
                                            : 'No Input nodes found'}
                                    </div>
                                ) : inputNodes.map((n) => (
                                    <button key={n.id} onClick={() => handlePickNode(n)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 12 }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 4, background: '#e0e7ff', color: '#1d4ed8', fontWeight: 700 }}>➜</span>
                                        <span>{n?.data?.inputName || 'input_1'}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-muted)' }}>{n?.data?.inputType || 'Text'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--color-muted)' }}>Step 2 • Select type</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px' }}>
                                {(typeOptionsFor(nodes.find((x) => x.id === selectedNodeId)) || []).map((t) => (
                                    <button key={t} onClick={() => handlePickType(t)} className="node-card__run" style={{ fontSize: 11 }}>{t}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
