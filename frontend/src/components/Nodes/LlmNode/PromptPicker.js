import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '../../../store/store';
import '../node-styles/nodes-common.css';

// Match full tokens like {{name.type}}
const VAR_FULL = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

// Lightweight two-step picker for inserting {{inputName.type}} and auto-connecting
export default function PromptPicker({ id, data, field, onChange }) {
    const inputVal = data?.[field.name] ?? '';
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [caret, setCaret] = useState(0);
    const [triggerStart, setTriggerStart] = useState(null); // index of '{{'
    const textareaRef = useRef(null);

    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);
    const addConnection = useStore((s) => s.addConnectionWithStyle);
    const removeEdge = useStore((s) => s.removeEdgeBetween);
    // regex lifted to module scope

    // Exclude any input node that is already connected to this LLM node's prompt handle
    const connectedSourceIds = useMemo(() => {
        const list = (edges || []).filter(
            (e) => e?.target === id && e?.targetHandle === `${id}-prompt`
        ).map((e) => e.source);
        return Array.from(new Set(list));
    }, [edges, id]);

    const inputNodes = useMemo(() => {
        return (nodes || []).filter(
            (n) => n.type === 'customInput' && !connectedSourceIds.includes(n.id)
        );
    }, [nodes, connectedSourceIds]);

    const availableTextNodes = useMemo(() => {
        const alreadySources = new Set(
            (edges || [])
                .filter((e) => e?.target === id && e?.targetHandle === `${id}-prompt`)
                .map((e) => e.source)
        );
        return (nodes || []).filter((n) => n.type === 'text' && !alreadySources.has(n.id));
    }, [nodes, edges, id]);

    // Whether there is any inbound connection to the LLM prompt handle
    const hasPromptConnection = useMemo(() => {
        return (edges || []).some((e) => e?.target === id && e?.targetHandle === `${id}-prompt`);
    }, [edges, id]);

    // Gather currently connected Text nodes for chip display and removal
    const connectedTextNodes = useMemo(() => {
        const inEdges = (edges || []).filter(
            (e) => e?.target === id && e?.targetHandle === `${id}-prompt`
        );
        const list = [];
        for (const e of inEdges) {
            const src = (nodes || []).find((n) => n.id === e.source);
            if (src && src.type === 'text') list.push({ node: src, edge: e });
        }
        return list;
    }, [edges, id, nodes]);

    // We allow connecting Text nodes to LLM prompt, but do not alter the prompt UI/read-only state.

    // Extract tokens like {{name.type}}
    const tokens = useMemo(() => {
        const result = [];
        const text = String(inputVal || '');
        let m;
        while ((m = VAR_FULL.exec(text)) !== null) {
            result.push({ name: m[1], type: m[2], start: m.index, end: m.index + m[0].length });
        }
        return result;
    }, [inputVal]);

    // Manage caret position so we can insert at cursor
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        const pos = Math.min(caret, String(inputVal).length);
        try {
            el.selectionStart = pos;
            el.selectionEnd = pos;
        } catch { }
    }, [show, caret, inputVal]);

    // Auto-size the textarea
    const autosize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };
    useEffect(() => {
        autosize();
    }, [inputVal]);

    // Build a display string with tokens hidden, and helpers to map indices between
    const prevDisplayRef = useRef('');
    const tokenSegments = useMemo(() => {
        // segments outside token ranges
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
        // Map display index to original index using segments
        let remaining = di;
        for (const seg of tokenSegments) {
            const segLen = seg.end - seg.start;
            if (remaining <= segLen) return seg.start + remaining;
            remaining -= segLen;
        }
        // if past the end, return original length
        return String(inputVal || '').length;
    };

    const handleTextChange = (e) => {
        const newDisplay = e.target.value;
        const selectionStart = e.target.selectionStart ?? 0;
        // Diff prev vs new display to compute inserted text and removed length
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
        // Trigger popup if just typed '{{'
        const leftDisp = newDisplay.slice(0, selectionStart);
        if (leftDisp.endsWith('{{')) {
            // Map display index back to original index for the brace start
            const braceStartOrig = displayToOriginal(selectionStart - 2);
            setTriggerStart(braceStartOrig);
            setShow(true);
            setStep(1);
            setSelectedNodeId(null);
        }
        // If the initiating '{{' was removed (cursor moved back across it), close popup
        if (show && step === 1 && typeof selectionStart === 'number') {
            const around = newDisplay.slice(Math.max(0, selectionStart - 2), selectionStart);
            if (!around.includes('{{')) {
                setShow(false);
                setTriggerStart(null);
            }
        }
    };

    // Replace the two braces with provided text after them
    const replaceDoubleBraceWith = (textAfter) => {
        const start = triggerStart ?? (caret - 2);
        const clampedStart = Math.max(0, start);
        const before = String(inputVal).slice(0, clampedStart);
        const after = String(inputVal).slice(clampedStart + 2);
        const next = before + '{{' + textAfter + after;
        onChange(id, field.name, next);
        // set caret after inserted
        const newPos = (before + '{{' + textAfter).length;
        setCaret(newPos);
        setTimeout(() => {
            const el = textareaRef.current;
            if (!el) return;
            try { el.setSelectionRange(newPos, newPos); } catch { }
        }, 0);
    };

    // Remove the just-typed '{{' completely (used when selecting a Text node)
    const removeDoubleBrace = () => {
        const start = triggerStart ?? (caret - 2);
        const clampedStart = Math.max(0, start);
        const before = String(inputVal).slice(0, clampedStart);
        const after = String(inputVal).slice(clampedStart + 2);
        const next = before + after;
        onChange(id, field.name, next);
        setCaret(clampedStart);
        setTimeout(() => {
            const el = textareaRef.current;
            if (!el) return;
            try { el.setSelectionRange(clampedStart, clampedStart); } catch { }
        }, 0);
    };

    const insertAtCaret = (text) => {
        const current = String(inputVal ?? '');
        const pos = caret ?? current.length;
        const next = current.slice(0, pos) + text + current.slice(pos);
        onChange(id, field.name, next);
        // Move caret after inserted text
        setTimeout(() => {
            const el = textareaRef.current;
            if (!el) return;
            const newPos = pos + text.length;
            el.focus();
            try {
                el.setSelectionRange(newPos, newPos);
            } catch { }
            setCaret(newPos);
        }, 0);
    };

    const handlePickNode = (n) => {
        setSelectedNodeId(n.id);
        // Replace just-typed '{{' with `{{name`
        replaceDoubleBraceWith(`${n?.data?.inputName || 'input_1'}`);
        setStep(2);
    };

    const typeOptionsFor = (n) => {
        const t = n?.data?.inputType || 'Text';
        // simple mapping; could be extended later
        if (t === 'File') return ['file'];
        return ['text'];
    };

    const handlePickType = (type) => {
        // complete as {{name.type}}}
        const n = nodes.find((x) => x.id === selectedNodeId);
        insertAtCaret(`.${type}}}`);
        setShow(false);
        setStep(1);
        setSelectedNodeId(null);
        setTriggerStart(null);
        // auto connect selected input node -> current LLM node (target handle: 'prompt') with yellow style
        if (n) {
            addConnection({ source: n.id, sourceHandle: `${n.id}-value`, target: id, targetHandle: `${id}-prompt` });
        }
    };

    const handlePickTextNode = (n) => {
        // Remove the just-typed '{{' entirely, then connect Text -> LLM.prompt
        removeDoubleBrace();
        setShow(false);
        setStep(1);
        setSelectedNodeId(null);
        setTriggerStart(null);
        if (n) {
            addConnection({ source: n.id, sourceHandle: `${n.id}-output`, target: id, targetHandle: `${id}-prompt` });
        }
    };

    const removeToken = (tok) => {
        const text = String(inputVal || '');
        // remove the token substring
        const next = text.slice(0, tok.start) + text.slice(tok.end);
        onChange(id, field.name, next);
        setCaret(tok.start);
        // also remove the corresponding connection
        const inputNode = (nodes || []).find((n) => (n.data?.inputName === tok.name) && n.type === 'customInput');
        if (inputNode) {
            removeEdge({ source: inputNode.id, sourceHandle: `${inputNode.id}-value`, target: id, targetHandle: `${id}-prompt` });
        }
    };

    const chipRowRef = useRef(null);
    const [chipPad, setChipPad] = useState(0);
    useEffect(() => {
        const el = chipRowRef.current;
        if (!el) { setChipPad(0); return; }
        const h = el.getBoundingClientRect().height;
        const hasChips = tokens.length > 0 || connectedTextNodes.length > 0;
        setChipPad(hasChips ? Math.ceil(h) + 6 : 0);
    }, [tokens, connectedTextNodes]);

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
                {connectedTextNodes.map(({ node }, i) => (
                    <span key={`textnode-${node.id}-${i}`} className="token-chip" style={{ padding: '1px', fontSize: 11, pointerEvents: 'auto' }}>
                        <span className="token-chip__icon" style={{ width: 10, height: 10 }}>T</span>
                        Text
                        <button
                            className="token-chip__remove"
                            onClick={() => removeEdge({ source: node.id, sourceHandle: `${node.id}-output`, target: id, targetHandle: `${id}-prompt` })}
                            title="Remove"
                            style={{ fontSize: 9, padding: 2 }}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <textarea
                ref={textareaRef}
                className={"node-card__input node-card__textarea"}
                value={displayValue}
                placeholder={(tokens.length || hasPromptConnection) ? '' : field.placeholder}
                rows={1}
                onInput={autosize}
                onClick={(e) => setCaret(e.target.selectionStart ?? 0)}
                onKeyUp={(e) => setCaret(e.target.selectionStart ?? 0)}
                onChange={handleTextChange}
                style={{ overflow: 'hidden', resize: 'none', paddingTop: chipPad || undefined }}
            />
            {show ? (
                <div style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: 6, width: 200, background: 'linear-gradient(180deg, #ffffff, #f8fafc)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: '0 10px 20px rgba(2,6,23,0.18)' }}>
                    {step === 1 ? (
                        <div>
                            <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--color-muted)' }}>Step 1 • Nodes</div>
                            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                                {inputNodes.length === 0 ? (
                                    <div style={{ padding: 10, fontSize: 12, color: 'var(--color-muted)' }}>
                                        {(nodes || []).some((n) => n.type === 'customInput')
                                            ? 'All input nodes are already connected'
                                            : 'No Input nodes found'
                                        }
                                    </div>
                                ) : inputNodes.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handlePickNode(n)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 12
                                        }}
                                    >
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 4, background: '#e0e7ff', color: '#1d4ed8', fontWeight: 700
                                        }}>➜</span>
                                        <span>{n?.data?.inputName || 'input_1'}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-muted)' }}>{n?.data?.inputType || 'Text'}</span>
                                    </button>
                                ))}
                                {/* Also list available Text nodes for direct connection */}
                                {availableTextNodes.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handlePickTextNode(n)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: 12
                                        }}
                                    >
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 4, background: '#dcfce7', color: '#166534', fontWeight: 700
                                        }}>T</span>
                                        <span title={(n?.data?.text || '').toString()} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                            {(n?.data?.text || '').toString() || 'Text'}
                                        </span>
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
