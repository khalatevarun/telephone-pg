# AI Translation Telephone Competition

A competitive "Telephone" game built for the **AI Gateway Hackathon**. Multiple AI models compete to translate a phrase through a chain of languages and back to English, with the winner determined by a sophisticated similarity scoring system combining semantic meaning and literal accuracy.

## How it Works

1. **Input**: Start with an English phrase (pre-filled with a default for easy testing).
2. **Competition**: Multiple AI models simultaneously translate the phrase through a customizable chain of languages (e.g., English → French → English → Spanish → English).
3. **Evaluation**: Each model's final output is compared to the original using:
   - **Semantic Similarity** (70%): Uses OpenAI embeddings to measure meaning preservation.
   - **Literal Similarity** (30%): Edit distance for character/word matching.
   - **Combined Score**: Weighted average of both metrics.
4. **Winner**: The model with the highest combined similarity score wins. Ties are broken by speed.

## Features

- **Multi-Model Competition**: Compare performance across different AI models (GPT-4o, Claude, Gemini, etc.).
- **Real-time Streaming**: Watch translations appear live for each model.
- **Per-Model Timers**: Track completion time for each participant.
- **Transparent Scoring**: View detailed semantic and literal scores for fairness.
- **Customizable Chains**: Add/remove languages dynamically.
- **Winner Highlighting**: Entire columns glow green for the winning model.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **AI**: Vercel AI SDK with AI Gateway, OpenAI text-embedding-3-small for similarity
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

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

## Hackathon Details

Built for the [AI Gateway Game Hackathon](https://ai-gateway-game-hackathon.vercel.app/). This project showcases:
- Efficient use of the Vercel AI Gateway for multi-model orchestration
- Advanced similarity metrics using embeddings
- Real-time competitive AI evaluation
- Innovative UI for comparing AI model performance

## Deploy on Vercel

Deploy easily with [Vercel](https://vercel.com/new) - the AI Gateway integration makes it seamless!

## Project Structure

- `src/app/page.tsx`: Main UI and game logic
- `src/app/streaming-actions.ts`: Server-side translation and similarity calculation
- `src/config/models.ts`: Model configurations
- `src/app/layout.tsx`: App layout and metadata

---

*telephone-pg* - Where AI models play telephone and compete for accuracy!
