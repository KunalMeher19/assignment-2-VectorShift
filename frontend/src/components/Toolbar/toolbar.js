// toolbar.js
import React, { useState } from 'react';
import { DraggableNode } from '../DraggableNode/draggableNode';
import { SubmitButton } from '../Submit/submit';
import './Toolbar.css';


export const PipelineToolbar = () => {
    const [query, setQuery] = useState('');

    const iconMap = {
        customInput: 'https://img.icons8.com/windows/64/login-rounded-right.png',
        customOutput: 'https://img.icons8.com/windows/64/export.png',
        llm: 'https://img.icons8.com/windows/64/robot-2.png',
        text: 'https://img.icons8.com/windows/64/text.png',
        uppercase: 'https://img.icons8.com/windows/64/caps-lock-on.png',
        concat: 'https://img.icons8.com/windows/64/plus-math.png',
        httpGet: 'https://img.icons8.com/external-kmg-design-glyph-kmg-design/64/external-transfer-arrows-kmg-design-glyph-kmg-design.png',
        delay: 'https://img.icons8.com/windows/64/time.png',
        variable: 'https://img.icons8.com/windows/64/variable.png',
    };

    const nodes = [
        { type: 'customInput', label: 'Input' },
        { type: 'llm', label: 'LLM' },
        { type: 'customOutput', label: 'Output' },
        { type: 'text', label: 'Text' },
        { type: 'uppercase', label: 'Uppercase' },
        { type: 'concat', label: 'Concat' },
        { type: 'httpGet', label: 'HTTP GET' },
        { type: 'delay', label: 'Delay' },
        { type: 'variable', label: 'Variable' },
    ];

    const filtered = nodes.filter(n => n.label.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="vs-toolbar">
            <div className="vs-toolbar__body">
                <div className="vs-toolbar__panel">
                    <div className="vs-panel__header">
                        <div className="vs-toolbar__search">
                            <div className="vs-search-wrap">
                                <img
                                  className="vs-search-icon"
                                  src="https://img.icons8.com/fluency-systems-filled/96/search.png"
                                  width={18}
                                  height={18}
                                  alt=""
                                  aria-hidden="true"
                                  draggable={false}
                                />
                                <input
                                    type="search"
                                    placeholder="Search Nodes"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    aria-label="Search nodes"
                                />
                            </div>
                        </div>
                        <span className="vs-panel__sub">Drag to canvas</span>
                        <div className="vs-toolbar__actions">
                            <SubmitButton />
                        </div>
                    </div>

                    <div className="vs-node-cards">
                        {filtered.map(n => (
                            <div key={n.type} className="vs-node-card">
                                <DraggableNode type={n.type} label={n.label} icon={iconMap[n.type]} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
