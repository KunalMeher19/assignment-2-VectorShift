// llmNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';
import PromptPicker from './PromptPicker';

export const LLMNode = makeNode({
  type: 'llm',
  title: 'LLM',
  icon: 'https://img.icons8.com/windows/64/robot-2.png',
  description: 'Generate responses from a selected provider and model',
  inputs: [{ id: 'system' }, { id: 'prompt' }],
  outputs: [{ id: 'response' }],
  fields: [
    // Text areas on the card for convenience. These DO NOT remove the existing input handles.
    { name: 'system', label: 'System (Instructions)', type: 'textarea', placeholder: 'Answer the Question based on Context in a professional manner.' },
    { name: 'prompt', label: 'Prompt', component: PromptPicker, placeholder: 'Type "{{" to utilize variables E.g., Question: {{input_0.text}}' },
    { name: 'provider', label: 'Provider', type: 'select', options: ['OpenAI', 'Anthropic', 'Local'], default: 'OpenAI' },
    { name: 'model', label: 'Model', type: 'text', default: 'gpt-4o-mini' },
  ],
});
