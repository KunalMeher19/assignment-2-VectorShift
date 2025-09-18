// textNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';
import TextPicker from './TextPicker';
import './textNode.css';

// Extract valid JS identifiers inside double curlies: {{ varName }}
// Allow dot suffix: {{inputName}} or {{inputName.text}} / {{inputName.file}}
const VAR_REGEX = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)(?:\.[A-Za-z_$][A-Za-z0-9_$]*)?\s*\}\}/g;

function parseVariables(text) {
  if (!text || typeof text !== 'string') return [];
  const vars = new Set();
  let m;
  while ((m = VAR_REGEX.exec(text)) !== null) {
    // m[1] is the base variable (before dot). Ensure unique base handles
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
    { name: 'text', label: 'Text', component: TextPicker, default: '{{input}}', placeholder: 'Type text… Use {{variable}} or start with {{ to pick inputs' },
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
