// textNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';

export const TextNode = makeNode({
  type: 'text',
  title: 'Text',
  icon: 'https://img.icons8.com/windows/64/text.png',
  inputs: [],
  outputs: [{ id: 'output' }],
  fields: [
    { name: 'text', label: 'Text', type: 'text', default: '{{input}}' },
  ],
});
