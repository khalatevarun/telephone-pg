'use server';

import { streamText, embed, cosineSimilarity } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export type StreamUpdate = {
  modelName: string;
  language: string;
  stepIndex: number;
  text: string;
  isComplete: boolean;
  similarity?: {
    semantic: number;
    literal: number;
    combined: number;
  };
};

async function calculateSimilarity(str1: string, str2: string): Promise<{ semantic: number; literal: number; combined: number }> {
  const normalized1 = str1.trim().toLowerCase();
  const normalized2 = str2.trim().toLowerCase();
  
  if (normalized1 === normalized2) {
    return { semantic: 1, literal: 1, combined: 1 };
  }
  
  try {
    const embeddingModel = gateway.textEmbeddingModel('text-embedding-3-small');
    
    const [embedding1, embedding2] = await Promise.all([
      embed({ model: embeddingModel, value: str1 }),
      embed({ model: embeddingModel, value: str2 })
    ]);
    
    const semantic = cosineSimilarity(embedding1.embedding, embedding2.embedding);
    
    // Literal similarity using edit distance
    const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
    const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
    let literal = 1;
    if (longer.length > 0) {
      const editDistance = getEditDistance(longer, shorter);
      literal = 1 - editDistance / longer.length;
    }
    
    const combined = 0.7 * semantic + 0.3 * literal;
    
    return { semantic, literal, combined };
  } catch (error) {
    console.error('Error calculating combined similarity:', error);
    // Fallback to literal similarity only
    const s1 = normalized1;
    const s2 = normalized2;
    
    if (s1 === s2) return { semantic: 1, literal: 1, combined: 1 };
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    let literal = 1;
    if (longer.length > 0) {
      const editDistance = getEditDistance(longer, shorter);
      literal = 1 - editDistance / longer.length;
    }
    return { semantic: 0, literal, combined: 0.3 * literal }; // Only literal contributes
  }
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
    stepIndex: 0,
    text: currentText,
    isComplete: false,
  };

  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];
    const stepIndex = i + 1;
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
          stepIndex,
          text: fullText,
          isComplete: false,
        };
      }

      currentText = fullText;

      // Emit completion update
      yield {
        modelName,
        language: step.lang,
        stepIndex,
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
        stepIndex,
        text: `[Error translating to ${step.lang}]`,
        isComplete: true,
      };
      // We continue to next step even if one fails
    }
  }

  // Calculate similarity only at the end
  const similarity = await calculateSimilarity(initialPhrase, currentText);

  yield {
    modelName,
    language: 'English',
    stepIndex: chain.length, // Target the last step (English) to update it with similarity
    text: currentText,
    isComplete: true,
    similarity,
  };
}
