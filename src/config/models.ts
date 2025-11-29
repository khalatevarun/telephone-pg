// Model configuration for AI Telephone Game
// Used by both backend (actions.ts) and frontend (page.tsx)
// Selected: Cheapest model from 3 different providers

export const COMPETING_MODELS = [
  {
    name: 'Gemini 2.5 Flash Lite',
    modelId: 'google/gemini-2.5-flash-lite',
    provider: 'Google',
    pricing: '$0.10/M input',
  },
  {
    name: 'Llama 3.3 70B',
    modelId: 'groq/llama-3.3-70b-versatile',
    provider: 'Groq',
    pricing: '$0.05/M input',
  }
];

// Translation chain configuration
export const TRANSLATION_CHAIN = [
  { lang: 'French' },
  { lang: 'Spanish' },
  { lang: 'English' },
];
