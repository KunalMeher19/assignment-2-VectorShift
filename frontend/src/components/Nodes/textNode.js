// textNode.js (refactored via baseNode)
import { makeNode } from './baseNode';

export const TextNode = makeNode({
  type: 'text',
  title: 'Text',
  inputs: [],
  outputs: [{ id: 'output' }],
  fields: [
    { name: 'text', label: 'Text', type: 'text', default: '{{input}}' },
  ],
});
