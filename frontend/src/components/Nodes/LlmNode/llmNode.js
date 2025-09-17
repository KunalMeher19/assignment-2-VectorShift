// llmNode.js (refactored via baseNode)
import { makeNode } from '../baseNode';

export const LLMNode = makeNode({
  type: 'llm',
  title: 'LLM',
  inputs: [{ id: 'system' }, { id: 'prompt' }],
  outputs: [{ id: 'response' }],
  fields: [
    { name: 'provider', label: 'Provider', type: 'select', options: ['OpenAI', 'Anthropic', 'Local'], default: 'OpenAI' },
    { name: 'model', label: 'Model', type: 'text', default: 'gpt-4o-mini' },
  ],
});
