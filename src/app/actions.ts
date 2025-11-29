'use server';

import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { COMPETING_MODELS } from '@/config/models';

export type TelephoneStep = {
  language: string;
  text: string;
  model: string;
};

export type ModelResult = {
  modelName: string;
  steps: TelephoneStep[];
  finalText: string;
  similarity: number;
};

export type GameResult = {
  originalPhrase: string;
  results: ModelResult[];
  winner: ModelResult;
};

export async function runTelephoneGameWithModels(
  initialPhrase: string
): Promise<GameResult> {
  // Run game for all models in parallel
  const results = await Promise.all(
    COMPETING_MODELS.map((model) =>
      runTelephoneGameForModel(initialPhrase, model.name, model.modelId)
    )
  );

  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);

  return {
    originalPhrase: initialPhrase,
    results,
    winner: results[0], // Highest similarity wins
  };
}
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Calculate Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = getEditDistance(longer, shorter);
  return 1 - editDistance / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// Run telephone game for a single model
async function runTelephoneGameForModel(
  initialPhrase: string,
  modelName: string,
  modelId: string
): Promise<ModelResult> {
  const steps: TelephoneStep[] = [];
  let currentText = initialPhrase;

  const chain = [
    { lang: 'French' },
    { lang: 'Spanish' },
    { lang: 'English' },
  ];

  steps.push({
    language: 'Original',
    text: currentText,
    model: modelName,
  });

  for (const step of chain) {
    try {
      const { text } = await generateText({
        model: gateway(modelId),
        system: `You are a helpful translator. Translate the following text to ${step.lang}. Only return the translated text, nothing else.`,
        prompt: currentText,
      });

      currentText = text;
      steps.push({
        language: step.lang,
        text: currentText,
        model: modelName,
      });
    } catch (error) {
      console.error(`Error translating to ${step.lang} with ${modelName}:`, error);
      steps.push({
        language: step.lang,
        text: `[Error translating to ${step.lang}]`,
        model: modelName,
      });
      throw error;
    }
  }

  const similarity = calculateSimilarity(initialPhrase, currentText);

  return {
    modelName,
    steps,
    finalText: currentText,
    similarity,
  };
}


