// extraNodes.js
// Demonstration nodes using the baseNode factory
import { makeNode } from './baseNode';

// 1) Uppercase transformer
export const UppercaseNode = makeNode({
  type: 'uppercase',
  title: 'Uppercase',
  inputs: [{ id: 'input' }],
  outputs: [{ id: 'output' }],
  fields: [
    { name: 'label', label: 'Label', type: 'text', default: 'toUpperCase' },
  ],
});

// 2) Concat two strings
export const ConcatNode = makeNode({
  type: 'concat',
  title: 'Concat',
  inputs: [{ id: 'a' }, { id: 'b' }],
  outputs: [{ id: 'result' }],
  fields: [
    { name: 'separator', label: 'Separator', type: 'text', default: ' ' },
  ],
});

// 3) HTTP GET (demo config only)
export const HttpGetNode = makeNode({
  type: 'httpGet',
  title: 'HTTP GET',
  inputs: [],
  outputs: [{ id: 'response' }],
  fields: [
    { name: 'url', label: 'URL', type: 'text', default: 'https://example.com' },
    { name: 'cache', label: 'Use Cache', type: 'toggle', default: false },
  ],
});

// 4) Delay node (simulated)
export const DelayNode = makeNode({
  type: 'delay',
  title: 'Delay',
  inputs: [{ id: 'input' }],
  outputs: [{ id: 'output' }],
  fields: [
    { name: 'ms', label: 'Milliseconds', type: 'number', default: 500 },
  ],
});

// 5) Variable node
export const VariableNode = makeNode({
  type: 'variable',
  title: 'Variable',
  inputs: [],
  outputs: [{ id: 'value' }],
  fields: [
    { name: 'name', label: 'Name', type: 'text', default: 'var1' },
    { name: 'value', label: 'Value', type: 'text', default: '' },
  ],
});
