// store.js

import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';

export const useStore = create(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      nodeIDs: {},
      // Compute whether a given Input name is unique among customInput nodes (excluding an optional node id)
      isInputNameUnique: (name, excludeId) => {
        const nodes = get().nodes || [];
        return !nodes.some((n) => n?.type === 'customInput' && n?.id !== excludeId && n?.data?.inputName === name);
      },
      // Returns the smallest available default name for Input nodes (reuses gaps like input_1 if freed)
      getNextInputName: () => {
        const { isInputNameUnique } = get();
        let i = 1;
        while (true) {
          const candidate = `input_${i}`;
          if (isInputNameUnique(candidate)) {
            return candidate;
          }
          i += 1;
        }
      },
      getNodeID: (type) => {
        const newIDs = { ...get().nodeIDs };
        if (newIDs[type] === undefined) {
          newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({ nodeIDs: newIDs });
        return `${type}-${newIDs[type]}`;
      },
      addNode: (node) => {
        set({
          nodes: [...get().nodes, node],
        });
      },
      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection) => {
        set({
          edges: addEdge(
            {
              ...connection,
              type: 'smoothstep',
              animated: true,
              markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
            },
            get().edges
          ),
        });
      },
      // Add a connection with a distinct yellow color for auto-wiring from PromptPicker
      addConnectionWithStyle: ({ source, sourceHandle, target, targetHandle }) => {
        const existing = get().edges.find(
          (e) => e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle
        );
        if (existing) return; // prevent duplicates
        const connection = {
          source,
          sourceHandle,
          target,
          targetHandle,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2 }, // amber-500
          markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
        };
        set({
          edges: addEdge(connection, get().edges),
        });
      },
      removeNode: (nodeId) => {
        const state = get();
        const nodesList = state.nodes || [];
        const edgesList = state.edges || [];
        const nodeToRemove = nodesList.find((n) => n.id === nodeId);

        // Remove edges involving this node as before
        const nextEdges = edgesList.filter((e) => e.source !== nodeId && e.target !== nodeId);

        // If removing a custom input, also remove its token usages from other nodes
        let nextNodes;
        if (nodeToRemove?.type === 'customInput') {
          const inputName = nodeToRemove?.data?.inputName;
          if (inputName && typeof inputName === 'string') {
            const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const nameEsc = escapeRegExp(inputName);
            const tokenRegex = new RegExp(`\\{\\{\\s*${nameEsc}(?:\\.[A-Za-z_$][A-Za-z0-9_$]*)?\\s*\\}\\}`, 'g');
            nextNodes = nodesList
              .filter((n) => n.id !== nodeId)
              .map((n) => {
                if (!n?.data) return n;
                // Only adjust known string fields to avoid unintended mutations
                if (n.type === 'llm') {
                  const sys = n.data.system;
                  const pr = n.data.prompt;
                  const newData = { ...n.data };
                  if (typeof sys === 'string') newData.system = sys.replace(tokenRegex, '');
                  if (typeof pr === 'string') newData.prompt = pr.replace(tokenRegex, '');
                  if (newData !== n.data) return { ...n, data: newData };
                  return n;
                }
                if (n.type === 'text') {
                  const txt = n.data.text;
                  if (typeof txt === 'string') {
                    const newText = txt.replace(tokenRegex, '');
                    if (newText !== txt) return { ...n, data: { ...n.data, text: newText } };
                  }
                  return n;
                }
                return n;
              });
          } else {
            nextNodes = nodesList.filter((n) => n.id !== nodeId);
          }
        } else {
          nextNodes = nodesList.filter((n) => n.id !== nodeId);
        }

        set({ nodes: nextNodes, edges: nextEdges });
      },
      removeEdgeBetween: ({ source, sourceHandle, target, targetHandle }) => {
        set({
          edges: get().edges.filter(
            (e) => !(e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle)
          ),
        });
      },
      updateNodeField: (nodeId, fieldName, fieldValue) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === nodeId) {
              node.data = { ...node.data, [fieldName]: fieldValue };
            }

            return node;
          }),
        });
      },
      clearGraph: () => set({ nodes: [], edges: [] }),
    }),
    {
      name: 'pipeline-graph-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        nodeIDs: state.nodeIDs,
      }),
      version: 1,
    }
  )
);
