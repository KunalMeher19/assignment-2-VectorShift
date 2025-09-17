// toolbar.js
import React from 'react';
import { DraggableNode } from '../DraggableNode/draggableNode';
import './Toolbar.css';

export const PipelineToolbar = () => {
    return (
        <div className="pipeline-toolbar">
            <div className="pipeline-toolbar__group">
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
