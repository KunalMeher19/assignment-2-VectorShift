// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import './ui.css';
import { useStore } from '../../store/store';
import { shallow } from 'zustand/shallow';
import { InputNode, LLMNode, OutputNode, TextNode, UppercaseNode, ConcatNode, HttpGetNode, DelayNode, VariableNode } from '../Nodes';

// reactflow base styles are imported before our overrides above

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  uppercase: UppercaseNode,
  concat: ConcatNode,
  httpGet: HttpGetNode,
  delay: DelayNode,
  variable: VariableNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  getNextInputName: state.getNextInputName,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    getNextInputName,
    onNodesChange,
    onEdgesChange,
    onConnect
  } = useStore(selector, shallow);

  const getInitNodeData = useCallback((nodeID, type) => {
    const nodeData = { id: nodeID, nodeType: `${type}` };
    // For Input nodes, set a unique default name using the global counter
    if (type === 'customInput') {
      nodeData.inputName = getNextInputName();
    }
    return nodeData;
  }, [getNextInputName]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const type = appData?.nodeType;

        // check if the dropped element is valid
        if (typeof type === 'undefined' || !type) {
          return;
        }

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };

        addNode(newNode);
      }
    },
    [reactFlowInstance, addNode, getNodeID, getInitNodeData]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <>
      <div ref={reactFlowWrapper} className="pipeline-ui__canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          snapGrid={[gridSize, gridSize]}
          connectionLineType='smoothstep'
        >
          <Background
            id="pipeline-dots"
            variant="dots"
            color="#a2a2a2ff" /* slightly darker gray for better contrast */
            gap={gridSize}
            size={1.5}
          />
          <Controls position="bottom-right" showInteractive={true} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={() => '#93c5fd'}
            nodeStrokeColor={() => '#3b82f6'}
            style={{ width: 180, height: 120, borderRadius: 12, background: '#ffffff' }}
          />
        </ReactFlow>
      </div>
    </>
  )
}
