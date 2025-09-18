// inputNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';

export const InputNode = makeNode({
  type: 'customInput',
  title: 'Input',
  icon: 'https://img.icons8.com/windows/64/login-rounded-right.png',
  description: 'Pass data of different types into your workflow',
  inputs: [],
  outputs: [{ id: 'value' }],
  fields: [
    // default provided by UI via store.getNextInputName on create; keep fallback
    { name: 'inputName', label: 'Name', type: 'text', placeholder: 'e.g., input_1' },
    { name: 'inputType', label: 'Type', type: 'select', options: ['Text', 'File'], default: 'Text' },
  ],
});
