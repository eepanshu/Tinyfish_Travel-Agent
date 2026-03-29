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

### Backend (Render)
1. **Create a New Web Service** on Render.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
6. Add **Environment Variables**:
   - `GROQ_API_KEY`: Your Groq API Key.
   - `TINYFISH_API_KEY`: Your TinyFish API Key.

### Frontend (Vercel)
1. **Create a New Project** on Vercel.
2. Connect your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Add **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: The URL of your Render backend (e.g., `https://tinyfish-backend.onrender.com`).
5. **Deploy!**
