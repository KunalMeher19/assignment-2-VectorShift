// outputNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';
import OutputPicker from './OutputPicker';

// Extract valid JS identifiers inside double curlies: {{ base }} or with type {{ base.text }}
const VAR_REGEX = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)(?:\.[A-Za-z_$][A-Za-z0-9_$]*)?\s*\}\}/g;

function parseVariables(text) {
  if (!text || typeof text !== 'string') return [];
  const vars = new Set();
  let m;
  while ((m = VAR_REGEX.exec(text)) !== null) {
    vars.add(m[1]);
  }
  return Array.from(vars);
}

export const OutputNode = makeNode({
  type: 'customOutput',
  title: 'Output',
  icon: 'https://img.icons8.com/windows/64/export.png',
  description: 'Expose results as the final output of your flow',
  inputs: [{ id: 'value' }],
  outputs: [],
  fields: [
    { name: 'outputName', label: 'Name', type: 'text', default: 'output_1' },
    { name: 'outputType', label: 'Type', type: 'select', options: ['Text', 'Image'], default: 'Text' },
    { name: 'output', label: 'Output', component: OutputPicker, default: '', placeholder: 'Type "{{" to insert values from inputs, text, or LLM' },
  ],
  // Add dynamic input handles for any token bases used in the output field
  getDynamicInputs: (data) => {
    const txt = data?.output || '';
    const vars = parseVariables(txt);
    return vars.map((v) => ({ id: v, label: v }));
  },
});
