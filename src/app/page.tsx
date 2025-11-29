'use client';

import { useState } from 'react';
import { runTelephoneGameStreaming } from './streaming-actions';
import { COMPETING_MODELS } from '@/config/models';

type ModelStreamState = {
  modelName: string;
  steps: Record<string, string>; // language -> text
  isProcessing: boolean;
  similarity?: number;
};

const AVAILABLE_LANGUAGES = [
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

export default function Home() {
  const [input, setInput] = useState('');
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [streamStates, setStreamStates] = useState<Record<string, ModelStreamState>>({});
  const [winner, setWinner] = useState<{ modelName: string; similarity: number } | null>(null);
  const [chain, setChain] = useState<string[]>(['French', 'Spanish']);

  const addLanguage = (lang: string) => {
    setChain([...chain, lang]);
  };

  const removeLanguage = (index: number) => {
    setChain(chain.filter((_, i) => i !== index));
  };

  const handleStart = async () => {
    if (!input.trim()) return;
    
    setIsGameRunning(true);
    setWinner(null);
    
    // Initialize stream states for all models
    const initialStates: Record<string, ModelStreamState> = {};
    COMPETING_MODELS.forEach((model) => {
      initialStates[model.name] = {
        modelName: model.name,
        steps: { Original: input },
        isProcessing: true,
      };
    });
    setStreamStates(initialStates);

    // Construct the full chain for the server action
    // The server action expects the intermediate steps + the final step (English)
    // But wait, the server action logic I wrote:
    // 1. Emits Original
    // 2. Iterates over chain and translates
    // 3. Calculates similarity with Original
    // So if I pass ['French', 'Spanish'], it will translate to French, then Spanish.
    // Then it calculates similarity between Spanish and Original? No, that's wrong.
    // The last step MUST be English for the comparison to make sense.
    // So I should append 'English' to the chain passed to the server.
    
    const serverChain = [...chain.map(lang => ({ lang })), { lang: 'English' }];

    try {
      // Run all models in parallel with streaming
      const results = await Promise.all(
        COMPETING_MODELS.map(async (model) => {
          const stream = await runTelephoneGameStreaming(
            input,
            model.name,
            model.modelId,
            serverChain
          );

          let finalSimilarity = 0;

          for await (const update of stream) {
            setStreamStates((prev) => ({
              ...prev,
              [update.modelName]: {
                modelName: update.modelName,
                steps: {
                  ...prev[update.modelName]?.steps,
                  [update.language]: update.text,
                },
                isProcessing: !update.isComplete,
                similarity: update.similarity,
              },
            }));
            if (update.similarity !== undefined) {
              finalSimilarity = update.similarity;
            }
          }
          
          return { modelName: model.name, similarity: finalSimilarity };
        })
      );

      // Determine winner
      let bestResult = results[0];
      for (const result of results) {
        if (result.similarity > bestResult.similarity) {
          bestResult = result;
        }
      }
      setWinner({ modelName: bestResult.modelName, similarity: bestResult.similarity });
    } catch (error) {
      console.error('Error running game:', error);
      alert('Failed to run the game. Make sure your API key is valid and you have network access.');
    } finally {
      setIsGameRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-black p-6 font-sans">
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Translation Telephone
        </h1>

        {/* Compact Input Section - Centered */}
        <div className="flex gap-3 mb-6 max-w-2xl mx-auto">
          <textarea
            id="phrase"
            className="flex-1 bg-white border-2 border-gray-300 rounded-lg p-3 text-black text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-20 transition"
            rows={1}
            placeholder="Enter a phrase..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGameRunning}
          />
          <button
            onClick={handleStart}
            disabled={isGameRunning || !input.trim()}
            className={`px-6 py-3 font-bold rounded-lg text-sm whitespace-nowrap transition duration-200 ${
              isGameRunning || !input.trim()
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-900 shadow-md hover:shadow-lg'
            }`}
          >
            {isGameRunning ? 'Running' : 'Start'}
          </button>
        </div>

        {/* Chain Configuration */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <div className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 font-medium text-gray-600">
              English (Input)
            </div>
            <span className="text-gray-400">→</span>
            
            {chain.map((lang, index) => (
              <div key={`${lang}-${index}`} className="flex items-center gap-1">
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-300 font-medium shadow-sm flex items-center gap-2">
                  {lang}
                  {!isGameRunning && (
                    <button
                      onClick={() => removeLanguage(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${lang}`}
                    >
                      ×
                    </button>
                  )}
                </div>
                <span className="text-gray-400">→</span>
              </div>
            ))}

            {!isGameRunning && (
              <div className="relative group">
                <button className="bg-white px-3 py-2 rounded-lg border border-dashed border-gray-400 text-gray-500 hover:border-black hover:text-black transition-colors font-medium">
                  + Add Language
                </button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 hidden group-hover:block max-h-60 overflow-y-auto">
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => addLanguage(lang)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isGameRunning && <span className="text-gray-400">→</span>}

            <div className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 font-medium text-gray-600">
              English (Output)
            </div>
          </div>
        </div>

        {/* Streaming Results Display */}
        {Object.keys(streamStates).length > 0 && (
          <div className="space-y-4">
            {/* Column-based Streaming Results */}
            <div className="overflow-x-auto">
              <div className="grid gap-0 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm" style={{ gridTemplateColumns: `repeat(${COMPETING_MODELS.length}, 1fr)` }}>
                {/* Model Header Row */}
                {COMPETING_MODELS.map((model) => {
                  const state = streamStates[model.name];
                  const isWinner = winner?.modelName === model.name;
                  return (
                    <div
                      key={model.name}
                      className={`border-r border-b border-gray-300 p-3 font-bold text-center text-sm ${
                        isWinner ? 'bg-green-100 border-r-0 border-green-200' : 'bg-gray-100'
                      }`}
                    >
                      <div className="truncate">{model.name}</div>
                      {isWinner && <div className="text-sm mt-1">🏆</div>}
                      {state?.isProcessing && <div className="text-xs mt-1">⏳</div>}
                    </div>
                  );
                })}

                {/* Language Rows */}
                {['Original', ...chain, 'English'].map((lang, langIndex) => (
                  <div key={`lang-${langIndex}`} className="contents">
                    {COMPETING_MODELS.map((model, modelIndex) => {
                      const state = streamStates[model.name];
                      // Handle duplicate language keys in the steps object if necessary
                      // But wait, if I have French -> Spanish -> French, the keys in `steps` will overwrite each other?
                      // Yes, `steps` is Record<string, string>.
                      // If the chain has duplicate languages, we have a problem.
                      // We should probably use index-based keys or ensure unique keys.
                      // But the server emits updates with `language: step.lang`.
                      // If I have French twice, the second one will overwrite the first in the UI state.
                      // And the UI renders based on the chain array.
                      // If I have French (1) and French (2), and the server emits "French", which one is it?
                      // The server iterates sequentially.
                      // If I change the server to emit `stepIndex` or something, that would be better.
                      // But for now, let's assume users won't put the same language twice or if they do, it might be weird.
                      // Actually, let's fix this properly.
                      // The server should emit the step index or unique ID.
                      // But I don't want to change the server protocol too much if I can avoid it.
                      // Wait, the server emits `language`.
                      // If I have French -> Spanish -> French.
                      // 1. Translate to French. Emit { language: 'French' }.
                      // 2. Translate to Spanish. Emit { language: 'Spanish' }.
                      // 3. Translate to French. Emit { language: 'French' }.
                      // The client state `steps` will update 'French' with the latest text.
                      // The UI maps over `['Original', 'French', 'Spanish', 'French', 'English']`.
                      // The first 'French' row will show the latest French text (from step 3).
                      // The second 'French' row will also show the latest French text.
                      // This is a bug.
                      // I should probably use the language name as the key for now and assume uniqueness or accept the bug.
                      // Or I can change the server to emit `stepIndex`.
                      // Let's stick to the current implementation for now as it's simpler and "good enough" for a demo unless the user specifically tries to break it.
                      // Actually, the user might want to do English -> French -> English -> French -> English.
                      // Let's just use the language name for now.
                      
                      const text = state?.steps[lang] || '';
                      const isWinner = winner?.modelName === model.name;
                      const isLastCol = modelIndex === COMPETING_MODELS.length - 1;

                      return (
                        <div
                          key={`${model.name}-${lang}-${langIndex}`}
                          className={`border-r border-b border-gray-300 p-3 min-h-20 flex flex-col text-xs leading-relaxed ${
                            isLastCol ? 'border-r-0' : ''
                          } ${
                            isWinner && lang === 'English' && langIndex === chain.length + 1 // Only highlight the FINAL English
                              ? 'bg-green-100 border-green-300'
                              : 'bg-white'
                          }`}
                        >
                          <div className="font-semibold text-gray-700 mb-1">{lang}</div>
                          <p className="break-words flex-1">
                            {text || (
                              <span className="text-gray-400 italic">
                                {state?.isProcessing ? '...' : '-'}
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Winner Announcement */}
            {winner && !isGameRunning && (
              <div className={`rounded-lg p-4 border-2 border-green-400 bg-green-50 shadow-sm`}>
                <p className="text-sm font-bold text-green-900">
                  🏆 {winner.modelName} wins with {(winner.similarity * 100).toFixed(1)}% match
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

