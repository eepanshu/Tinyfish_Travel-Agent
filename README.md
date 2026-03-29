# TinyFish Travel Agent 🐠✈️

TinyFish is an autonomous travel orchestration platform that leverages agentic AI to search, plan, and verify travel itineraries across multiple providers in real-time.

Built with a **Next.js** frontend and a **FastAPI** backend, TinyFish uses the TinyFish Agent SDK to perform live web automation and search tasks.

## 🏗️ Project Structure

- **`/frontend`**: Next.js application (React 19, Tailwind CSS 4).
- **`/backend`**: FastAPI application (Python 3.10+).

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI)

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # Windows
    # or
    source venv/bin/activate  # macOS/Linux
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt  # If available, or install fastapi uvicorn httpx
    ```
4.  Configure Environment Variables:
    Create a `.env` file in the `backend/` root with:
    ```env
    GROQ_API_KEY=your_groq_key
    TINYFISH_API_KEY=your_tinyfish_key
    ```
5.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```
    *API documentation available at `http://localhost:8000/docs`.*

---

### 2. Frontend Setup (Next.js)

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    *Access the UI at `http://localhost:3000`.*

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: FastAPI, Pydantic, HTTPX, WebSockets for live streaming.
- **AI Agent**: TinyFish Agent SDK (https://agent.tinyfish.ai).
- **LLM Intelligence**: Groq (Llama 3/Mistral models).

## 🌟 Key Features

- **Live Multi-Agent Orchestration**: Parallel agents (Agent 01, Agent 02) search for flights and hotels concurrently.
- **Real-Time Visualizer**: Watch the agent's browse-frame and browser actions live in the UI.
- **Intelligent Parsers**: Automatic extraction of unstructured flight/hotel data into a verified inventory list.
- **Strategy Summaries**: Confirmed costs, budget tracking, and expert travel tips synthesized by AI.

---

## 📦 Deployment

Powered by **TinyFish Intelligence** and **Groq**.
Ready for deployment via Vercel (Frontend) and any ASGI-compatible Python host (Backend).
