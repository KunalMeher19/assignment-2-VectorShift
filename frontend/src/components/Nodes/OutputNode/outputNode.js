// outputNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';

export const OutputNode = makeNode({
  type: 'customOutput',
  title: 'Output',
  icon: 'https://img.icons8.com/windows/64/export.png',
  inputs: [{ id: 'value' }],
  outputs: [],
  fields: [
    { name: 'outputName', label: 'Name', type: 'text', default: 'output_1' },
    { name: 'outputType', label: 'Type', type: 'select', options: ['Text', 'Image'], default: 'Text' },
  ],
});
