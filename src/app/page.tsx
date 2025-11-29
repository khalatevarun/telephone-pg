'use client';

import { useState } from 'react';
import { runTelephoneGameWithModels, GameResult } from './actions';
import { COMPETING_MODELS } from '@/config/models';

export default function Home() {
  const [input, setInput] = useState('');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setGameResult(null);
    try {
      const result = await runTelephoneGameWithModels(input);
      setGameResult(result);
    } catch (error) {
      console.error('Error running game:', error);
      alert('Failed to run the game. Make sure you have configured your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center border-b-2 border-black pb-4">
          AI Telephone Game
        </h1>
        <p className="text-center mb-8 text-gray-600">
          Watch how AI models preserve meaning through translation chains
        </p>

        <div className="bg-white border-2 border-black p-6 mb-8">
          <label htmlFor="phrase" className="block text-sm font-bold mb-2">
            Enter a phrase:
          </label>
          <textarea
            id="phrase"
            className="w-full bg-white border-2 border-black p-3 text-black focus:outline-2 focus:outline-offset-2 focus:outline-black"
            rows={2}
            placeholder="The quick brown fox jumps over the lazy dog..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={handleStart}
            disabled={isLoading || !input.trim()}
            className={`mt-4 w-full py-2 px-4 font-bold border-2 border-black ${
              isLoading || !input.trim()
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isLoading ? 'Running...' : 'Start Competition'}
          </button>
        </div>

        {/* Competing Models Preview */}
        <div className="border-2 border-black p-4 mb-8 bg-gray-50">
          <h2 className="font-bold mb-3">Competing Models (Budget-Friendly)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPETING_MODELS.map((model) => (
              <div key={model.modelId} className="border-2 border-black p-3">
                <p className="font-bold text-sm">{model.name}</p>
                <p className="text-xs text-gray-600">{model.modelId}</p>
                <p className="text-xs font-semibold mt-1">{model.provider}</p>
                <p className="text-xs text-gray-500 mt-1">{model.pricing}</p>
              </div>
            ))}
          </div>
        </div>

        {gameResult && (
          <div className="space-y-6">
            {/* Original Phrase */}
            <div className="border-2 border-black p-4">
              <h2 className="font-bold mb-2">ORIGINAL PHRASE</h2>
              <p className="text-lg">{gameResult.originalPhrase}</p>
            </div>

            {/* Column-based Results Display */}
            <div>
              <h2 className="font-bold text-xl mb-4 border-b-2 border-black pb-2">
                TRANSLATION CHAIN
              </h2>
              
              {/* Get all unique languages in order */}
              {gameResult.results[0] && (
                <div className="overflow-x-auto border-2 border-black">
                  <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${gameResult.results.length}, 1fr)` }}>
                    {/* Header Row - Model Names */}
                    {gameResult.results.map((result) => (
                      <div
                        key={result.modelName}
                        className={`border-r-2 border-b-2 border-black p-4 font-bold text-center ${
                          result === gameResult.winner ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        {result.modelName}
                        {result === gameResult.winner && (
                          <div className="text-sm mt-1">🏆 WINNER</div>
                        )}
                      </div>
                    ))}

                    {/* Translation Rows */}
                    {gameResult.results[0].steps.map((_, stepIndex) => (
                      <div key={`step-${stepIndex}`} className="contents">
                        {gameResult.results.map((result, modelIndex) => {
                          const step = result.steps[stepIndex];
                          const isLastStep = stepIndex === result.steps.length - 1;
                          
                          return (
                            <div
                              key={`${result.modelName}-${stepIndex}`}
                              className={`border-r-2 border-b-2 border-black p-4 ${
                                modelIndex !== gameResult.results.length - 1 ? 'border-r-2' : ''
                              } ${
                                result === gameResult.winner && isLastStep
                                  ? 'bg-green-50'
                                  : ''
                              }`}
                            >
                              <div className="font-bold text-sm mb-2 text-gray-700">
                                {step.language}
                              </div>
                              <p className="text-sm break-words">{step.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winner Announcement */}
              <div className="mt-8 border-4 border-green-500 bg-green-100 p-6">
                <h3 className="font-bold text-2xl mb-3">🏆 WINNER</h3>
                <p className="font-bold text-lg mb-4">{gameResult.winner.modelName}</p>
                <p className="text-sm mb-4">
                  Similarity to Original: <span className="font-bold text-lg">{(gameResult.winner.similarity * 100).toFixed(1)}%</span>
                </p>
                <p className="font-bold mb-2">Final Result:</p>
                <p className="text-lg border-l-4 border-green-500 pl-4 py-2 bg-white border-2 border-green-300 p-3">
                  &quot;{gameResult.winner.finalText}&quot;
                </p>
              </div>

              {/* All Results Summary */}
              <div className="mt-6 border-2 border-black p-4">
                <h3 className="font-bold mb-3">FINAL SCORES</h3>
                <div className="space-y-2">
                  {gameResult.results.map((result, index) => (
                    <div key={result.modelName} className="flex justify-between items-center p-3 border-b border-gray-300">
                      <span className="font-semibold">
                        {result === gameResult.winner ? '🏆' : `${index + 1}.`} {result.modelName}
                      </span>
                      <span className="font-bold">
                        {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
