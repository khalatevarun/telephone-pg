'use server';

import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export type StreamUpdate = {
  modelName: string;
  language: string;
  text: string;
  isComplete: boolean;
  similarity?: number;
};

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
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

export async function* runTelephoneGameStreaming(
  initialPhrase: string,
  modelName: string,
  modelId: string,
  chain: { lang: string }[]
): AsyncGenerator<StreamUpdate, void, unknown> {
  let currentText = initialPhrase;

  // Emit original
  yield {
    modelName,
    language: 'Original',
    text: currentText,
    isComplete: false,
  };

  for (const step of chain) {
    try {
      let fullText = '';

      const { textStream } = streamText({
        model: gateway(modelId),
        system: `You are a helpful translator. Translate the following text to ${step.lang}. Only return the translated text, nothing else.`,
        prompt: currentText,
      });

      for await (const chunk of textStream) {
        fullText += chunk;
        // Emit partial update
        yield {
          modelName,
          language: step.lang,
          text: fullText,
          isComplete: false,
        };
      }

      currentText = fullText;

      // Emit completion update
      yield {
        modelName,
        language: step.lang,
        text: fullText,
        isComplete: true,
      };
    } catch (error) {
      console.error(
        `Error translating to ${step.lang} with ${modelName}:`,
        error
      );
      yield {
        modelName,
        language: step.lang,
        text: `[Error translating to ${step.lang}]`,
        isComplete: true,
      };
      // We continue to next step even if one fails
    }
  }

  // Calculate similarity only at the end
  const similarity = calculateSimilarity(initialPhrase, currentText);

  yield {
    modelName,
    language: 'English',
    text: currentText,
    isComplete: true,
    similarity,
  };
}
