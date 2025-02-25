# SalesBot - AI-Powered Sales Interview Simulator

SalesBot is a full-stack web application that simulates a sales interview using Vapi's AI-powered voice assistant. The app allows users to engage in a mock interview, receive a transcript, and get feedback on their performance.

## Features
- **Voice-Based Interview**: Simulates a real sales interview with an AI assistant.
- **Live Speech Indicator**: Shows when the assistant is speaking.
- **Call Scoring & Summary**: Generates a summary and scores based on clarity, relevance, and persuasiveness.
- **Data Storage**: Stores call data in a Supabase database.
- **Responsive UI**: Styled using Tailwind CSS.

---

## Setup Instructions

### 1. Clone the Repository
```sh
git clone https://github.com/yourusername/salesbot.git
cd salesbot
```
### 2. Install Dependencies

Ensure you have Node.js installed (v18+ recommended). Then, install the dependencies:
```sh
npm install
```
### 3. Configure Environment Variables

Create a .env.local file in the root directory and add the following:
``` sh
NEXT_PUBLIC_VAPI_KEY=your_vapi_public_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Replace the placeholder values with your actual API keys.
### 4. Set Up Supabase

Create a new table named **interviews** with the following columns:

- **call_id** (UUID, Primary Key)

- **transcript** (TEXT)

- **summary** (TEXT)

- **clarity** (INTEGER)

- **relevance** (INTEGER)

- **persuasiveness** (INTEGER)

Get your Supabase URL and API Key from the Project Settings and add them to .env.local.

### 5. Run the Development Server
``` sh
npm run dev
``` 
The app will be available at http://localhost:3000.

## Vapi Configuration Steps

1. Sign up at Vapi and create a new assistant.

2. Configure the assistant's responses for a sales interview.

3. Get your Vapi Public Key and Assistant ID from the Vapi dashboard.

4. Add them to your .env.local file.

## How to Test the App

1. Start the app with npm run dev.

2. Click Start Interview to begin a simulated call.

3. Speak with the AI assistant.

4. End the call, and the transcript with scores should appear.

5. Check the Supabase database for stored interview data.

## Tech Stack

    Frontend: Next.js, Tailwind CSS
    Backend: Supabase
    AI Integration: Vapi
    Deployment: Vercel (recommended)

## Future Improvements

- Enhancing the AI model for better interview assessment.
- Implementing user authentication.
- Adding a dashboard for tracking multiple interviews.
