// llmNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';

export const LLMNode = makeNode({
  type: 'llm',
  title: 'LLM',
  icon: 'https://img.icons8.com/windows/64/robot-2.png',
  inputs: [{ id: 'system' }, { id: 'prompt' }],
  outputs: [{ id: 'response' }],
  fields: [
    { name: 'provider', label: 'Provider', type: 'select', options: ['OpenAI', 'Anthropic', 'Local'], default: 'OpenAI' },
    { name: 'model', label: 'Model', type: 'text', default: 'gpt-4o-mini' },
  ],
});
