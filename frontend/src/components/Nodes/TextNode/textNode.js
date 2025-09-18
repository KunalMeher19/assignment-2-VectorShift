// textNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';
import './textNode.css';

// Extract valid JS identifiers inside double curlies: {{ varName }}
const VAR_REGEX = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

function parseVariables(text) {
  if (!text || typeof text !== 'string') return [];
  const vars = new Set();
  let m;
  while ((m = VAR_REGEX.exec(text)) !== null) {
    vars.add(m[1]);
  }
  return Array.from(vars);
}

export const TextNode = makeNode({
  type: 'text',
  title: 'Text',
  icon: 'https://img.icons8.com/windows/64/text.png',
  description: 'Create static or templated text values',
  inputs: [],
  outputs: [{ id: 'output' }],
  fields: [
    { name: 'text', label: 'Text', type: 'textarea', default: '{{input}}', placeholder: 'Type text… Use {{variable}} to create inputs' },
  ],
  // Add dynamic handles for variables referenced in text
  getDynamicInputs: (data) => {
    const text = data?.text || '';
    const vars = parseVariables(text);
    return vars.map((v) => ({ id: v, label: v }));
  },
  // Grow width/height a bit as text gets longer to improve visibility
  computeStyle: (data) => {
    const text = data?.text || '';
    // rough char-based sizing with caps
    const baseW = 210; // from nodes-common.css
    const extraW = Math.min(240, Math.floor(text.length / 24) * 40);
    return {
      width: baseW + extraW,
      height: 'auto',
    };
  },
});
