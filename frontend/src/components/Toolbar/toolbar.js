// toolbar.js
import React, { useState } from 'react';
import { DraggableNode } from '../DraggableNode/draggableNode';
import { SubmitButton } from '../Submit/submit';
import './Toolbar.css';


export const PipelineToolbar = () => {
    const [activeTab, setActiveTab] = useState('Start');
    const [query, setQuery] = useState('');

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
            <div className="vs-toolbar__top">
                <div className="vs-toolbar__search">
                    <input
                        type="search"
                        placeholder="Search Nodes"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search nodes"
                    />
                </div>
                <div className="vs-toolbar__actions">
                    <SubmitButton />
                </div>
            </div>

            <div className="vs-toolbar__body">
                <div className="vs-toolbar__panel">
                    <div className="vs-panel__header">
                        <h4>Start</h4>
                        <span className="vs-panel__sub">Drag to canvas</span>
                    </div>

                    <div className="vs-node-cards">
                        {filtered.map(n => (
                            <div key={n.type} className="vs-node-card">
                                <DraggableNode type={n.type} label={n.label} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
