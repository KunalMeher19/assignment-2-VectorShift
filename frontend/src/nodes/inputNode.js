// inputNode.js (refactored via baseNode)
import { makeNode } from './baseNode';

export const InputNode = makeNode({
  type: 'customInput',
  title: 'Input',
  inputs: [],
  outputs: [{ id: 'value' }],
  fields: [
    { name: 'inputName', label: 'Name', type: 'text', default: 'input_1' },
    { name: 'inputType', label: 'Type', type: 'select', options: ['Text', 'File'], default: 'Text' },
  ],
});
