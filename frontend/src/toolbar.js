// toolbar.js
import React from 'react';
import { DraggableNode } from './draggableNode';

export const PipelineToolbar = () => {

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <DraggableNode type='customInput' label='Input' />
                <DraggableNode type='llm' label='LLM' />
                <DraggableNode type='customOutput' label='Output' />
                <DraggableNode type='text' label='Text' />
                <DraggableNode type='uppercase' label='Uppercase' />
                <DraggableNode type='concat' label='Concat' />
                <DraggableNode type='httpGet' label='HTTP GET' />
                <DraggableNode type='delay' label='Delay' />
                <DraggableNode type='variable' label='Variable' />
            </div>
        </div>
    );
};
