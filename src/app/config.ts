// Model configuration for AI Telephone Game
// Used by both backend (actions.ts) and frontend (page.tsx)
// Selected: Cheapest model from different providers

export const COMPETING_MODELS = [
  {
    name: 'Gemini 2.5 Flash Lite',
    modelId: 'google/gemini-2.5-flash-lite',
  },
  {
    name: 'Llama 3.3 70B',
    modelId: 'groq/llama-3.3-70b-versatile',
  },
  {
    name: 'GPT-4o Mini',
    modelId: 'openai/gpt-4o-mini',
  },
  {
    name: 'Claude 3 Haiku',
    modelId: 'anthropic/claude-3-haiku-20240307',
  }
];

export const AVAILABLE_LANGUAGES = [
  'French',
  'Spanish',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Japanese',
  'Chinese',
  'Hindi',
  'Arabic',
  'Korean',
  'Turkish',
  'Dutch',
  'Swedish',
  'Polish',
];