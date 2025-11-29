# AI Telephone Game

A "Telephone" game built for the AI Gateway Game Hackathon. This game demonstrates how information mutates as it passes through multiple AI models and languages.

## How it Works

1.  **Input**: You enter a phrase in English.
2.  **The Chain**: The phrase is passed through a sequence of transformations:
    *   English -> French
    *   French -> English
    *   English -> Spanish
    *   Spanish -> English
    *   English -> Japanese
    *   Japanese -> English
    *   English -> Emoji
3.  **Result**: See how the meaning changes (or survives!) the journey.

## Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **AI**: Vercel AI SDK + OpenAI (GPT-4o)
*   **Styling**: Tailwind CSS

## Getting Started

1.  **Clone the repo**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Environment Variables**:
    Create a `.env.local` file and add your OpenAI API key:
    ```bash
    OPENAI_API_KEY=sk-...
    ```
4.  **Run the development server**:
    ```bash
    npm run dev
    ```
5.  **Play**: Open [http://localhost:3000](http://localhost:3000)

## Hackathon Details

Built for the [AI Gateway Game Hackathon](https://ai-gateway-game-hackathon.vercel.app/).
This project uses the Vercel AI SDK to chain multiple model calls.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

# telephone-pg
