'use client';

import { useState, useEffect } from 'react';
import { runTelephoneGameStreaming } from './streaming-actions';
import { COMPETING_MODELS } from '@/config/models';

type ModelStreamState = {
  modelName: string;
  steps: Record<number, string>; // stepIndex -> text
  isProcessing: boolean;
  similarity?: {
    semantic: number;
    literal: number;
    combined: number;
  };
  startTime?: number;
  endTime?: number;
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

const Timer = ({ startTime, endTime }: { startTime?: number; endTime?: number }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endTime || !startTime) return;

    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [endTime, startTime]);

  if (!startTime) return <div className="text-xs font-mono mt-1 text-gray-600">0.0s</div>;

  const elapsed = endTime ? endTime - startTime : now - startTime;
  return <div className="text-xs font-mono mt-1 text-gray-600">{(Math.max(0, elapsed) / 1000).toFixed(1)}s</div>;
};

export default function Home() {
  const [input, setInput] = useState('');
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [streamStates, setStreamStates] = useState<Record<string, ModelStreamState>>({});
  const [winners, setWinners] = useState<{ modelName: string; similarity?: { semantic: number; literal: number; combined: number }; duration: number }[]>([]);
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
    setWinners([]);
    
    // Initialize stream states for all models
    const initialStates: Record<string, ModelStreamState> = {};
    const now = Date.now();
    COMPETING_MODELS.forEach((model) => {
      initialStates[model.name] = {
        modelName: model.name,
        steps: { 0: input }, // 0 is Original
        isProcessing: true,
        startTime: now,
      };
    });
    setStreamStates(initialStates);

    // Construct the full chain for the server action
    // The server action expects the intermediate steps + the final step (English)
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

          let finalSimilarity: { semantic: number; literal: number; combined: number } | undefined;

          for await (const update of stream) {
            setStreamStates((prev) => {
              const newState = {
                ...prev,
                [update.modelName]: {
                  modelName: update.modelName,
                  steps: {
                    ...prev[update.modelName]?.steps,
                    [update.stepIndex]: update.text,
                  },
                  isProcessing: !update.isComplete,
                  similarity: update.similarity,
                  startTime: prev[update.modelName]?.startTime,
                  endTime: update.isComplete && update.language === 'English' ? Date.now() : prev[update.modelName]?.endTime,
                },
              };
              return newState;
            });
            if (update.similarity !== undefined) {
              finalSimilarity = update.similarity;
            }
          }
          
          // Calculate duration
          // We need to access the latest state to get the start time, but we can't access state inside the loop reliably without refs.
          // However, we set the start time for all models at the beginning (variable `now`).
          const duration = Date.now() - now;

          return { modelName: model.name, similarity: finalSimilarity, duration };
        })
      );

      // Determine winner(s)
      // Logic: Highest combined similarity wins. If tie (within tolerance), fastest wins.
      const validResults = results.filter(r => r.similarity !== undefined);
      let maxSimilarity = -1;
      for (const result of validResults) {
        if (result.similarity!.combined > maxSimilarity) {
          maxSimilarity = result.similarity!.combined;
        }
      }

      // Filter for candidates with high similarity
      const candidates = validResults.filter(r => Math.abs(r.similarity!.combined - maxSimilarity) < 0.0001);
      
      // Sort candidates by duration (ascending)
      candidates.sort((a, b) => a.duration - b.duration);

      // The winner is the first one (fastest among the best)
      // We can have multiple winners if they have exact same duration (unlikely but possible)
      const bestDuration = candidates[0].duration;
      const winningModels = candidates.filter(c => Math.abs(c.duration - bestDuration) < 50); // 50ms tolerance for time tie

      setWinners(winningModels);

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
          <input
            type="text"
            id="phrase"
            className="flex-1 bg-white border-2 border-gray-300 rounded-lg p-3 text-black text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-20 transition"
            placeholder="Enter a phrase..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isGameRunning && input.trim()) {
                handleStart();
              }
            }}
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
        <div className="space-y-4">
            {/* Column-based Streaming Results */}
            <div className="overflow-x-auto">
              <div className="grid gap-0 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm" style={{ gridTemplateColumns: `repeat(${COMPETING_MODELS.length}, 1fr)` }}>
                {/* Model Header Row */}
                {COMPETING_MODELS.map((model) => {
                  const state = streamStates[model.name];
                  const isWinner = winners.some(w => w.modelName === model.name);
                  
                  return (
                    <div
                      key={model.name}
                      className={`border-r border-b border-gray-300 p-3 font-bold text-center text-sm ${
                        isWinner ? 'bg-green-100 border-r-0 border-green-200' : 'bg-gray-100'
                      }`}
                    >
                      <div className="truncate">{model.name}</div>
                      <Timer startTime={state?.startTime} endTime={state?.endTime} />
                    </div>
                  );
                })}

                {/* Language Rows */}
                {Array.from({ length: chain.length + 2 }).map((_, stepIndex) => {
                  // Determine the label for this row
                  let rowLabel = '';
                  if (stepIndex === 0) {
                    rowLabel = 'Original';
                  } else if (stepIndex === chain.length + 1) {
                    rowLabel = 'English (Final)';
                  } else {
                    // Intermediate steps are 1-based in the loop, but 0-based in the chain array
                    rowLabel = chain[stepIndex - 1];
                  }

                  return (
                    <div key={`step-${stepIndex}`} className="contents">
                      {COMPETING_MODELS.map((model, modelIndex) => {
                        const state = streamStates[model.name];
                        const text = state?.steps[stepIndex] || '';
                        const isWinner = winners.some(w => w.modelName === model.name);
                        const isLastCol = modelIndex === COMPETING_MODELS.length - 1;

                        return (
                          <div
                            key={`${model.name}-${stepIndex}`}
                            className={`border-r border-b border-gray-300 p-3 min-h-20 flex flex-col text-xs leading-relaxed ${
                              isLastCol ? 'border-r-0' : ''
                            } ${
                              isWinner
                                ? 'bg-green-100 border-green-300'
                                : 'bg-white'
                            }`}
                          >
                            <div className="font-semibold text-gray-700 mb-1">{rowLabel}</div>
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
                  );
                })}

                {/* Score Row */}
                <div className="contents">
                  {COMPETING_MODELS.map((model, modelIndex) => {
                    const state = streamStates[model.name];
                    const sim = state?.similarity;
                    const isLastCol = modelIndex === COMPETING_MODELS.length - 1;
                    const isWinner = winners.some(w => w.modelName === model.name);
                    
                    return (
                      <div
                        key={`score-${model.name}`}
                        className={`border-r border-b border-gray-300 p-3 min-h-20 flex flex-col text-xs leading-relaxed ${
                          isLastCol ? 'border-r-0' : ''
                        } ${
                          isWinner
                            ? 'bg-green-100 border-green-300'
                            : 'bg-white'
                        }`}
                      >
                        <div className="font-semibold text-gray-700 mb-1">Score</div>
                        <p className="break-words flex-1">
                          {sim ? `${(sim.combined * 100).toFixed(1)}% (semantic: ${(sim.semantic * 100).toFixed(1)}%, literal: ${(sim.literal * 100).toFixed(1)}%)` : '-'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Winner Announcement */}
            {winners.length > 0 && !isGameRunning && (
              <div className={`rounded-lg p-4 border-2 border-green-400 bg-green-50 shadow-sm`}>
                <p className="text-sm font-bold text-green-900">
                  🏆 {winners.map(w => w.modelName).join(' & ')} {winners.length > 1 ? 'win' : 'wins'} with {(winners[0].similarity!.combined * 100).toFixed(1)}% match in {(winners[0].duration / 1000).toFixed(1)}s
                </p>
              </div>
            )}
          </div>
      </div>
    </main>
  );
}

