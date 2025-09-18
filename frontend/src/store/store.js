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
      removeNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== nodeId),
          edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
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
