# Translation Telephone - A Model Eval Game

https://github.com/user-attachments/assets/f8c95567-0fec-4dae-963f-2d599738f169

A competitive "Telephone" game built for the **AI Gateway Hackathon**. Multiple AI models compete to translate a phrase through a chain of languages and back to English, with the winner determined by a sophisticated similarity scoring system combining semantic meaning and literal accuracy.


## How it Works

1. **Input**: Start with an English phrase (pre-filled with a default for easy testing).
2. **Competition**: Multiple AI models simultaneously translate the phrase through a customizable chain of languages (e.g., English → French → Japanese → English).
3. **Evaluation**: Each model's final English output is compared to the original using:
   - **Semantic Similarity** (90%): Uses OpenAI embeddings to measure meaning preservation.
   - **Literal Similarity** (10%): Edit distance for character/word matching.
   - **Combined Score**: Weighted average of both metrics.
4. **Winner**: The model with the highest combined score wins. Ties are broken by speed.

## Features

- **Multi-Model Competition**: Compare performance across different AI models (GPT-4o, Claude, Gemini, etc.).
- **Real-time Streaming**: Watch translations appear live for each model.
- **Transparent Scoring**: View detailed semantic and literal scores for fairness.
- **Customizable Chains**: Add/remove languages dynamically.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **AI**: Vercel AI SDK with AI Gateway, OpenAI text-embedding-3-small for similarity


## Getting Started

1. **Clone the repo**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Create a `.env.local` file and add your Vercel AI Gateway API key:
   ```bash
   AI_GATEWAY_API_KEY=vck_...
   ```
   Get your key from [Vercel AI Gateway](https://vercel.com/docs/ai/ai-gateway).
4. **Run the development server**:
   ```bash
   npm run dev
   ```
5. **Play**: Open [http://localhost:3000](http://localhost:3000) and click "Start Game"!






## Project Structure

- `src/app/page.tsx`: Main UI and game logic
- `src/app/streaming-actions.ts`: Server-side translation and similarity calculation
- `src/config/models.ts`: Model configurations
- `src/app/layout.tsx`: App layout and metadata

---

Built for the [AI Gateway Game Hackathon](https://ai-gateway-game-hackathon.vercel.app/). 
