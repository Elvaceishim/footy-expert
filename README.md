# Football Prediction App

A professional football prediction application using advanced statistical analysis, real-time data, and AI-powered match analysis.

## Features

- **Real-time Football Data**: Live match results, standings, and fixtures for top European leagues
- **Advanced Statistical Analysis**: Enhanced Dixon-Coles model for accurate match predictions  
- **AI-Powered Analysis**: Professional match breakdowns using DeepSeek V3.1 with detailed reasoning
- **Multi-League Support**: Premier League, La Liga, Bundesliga, Serie A, Ligue 1
- **Interactive Chat**: Ask questions about recent results, standings, and team form
- **Fallback Data**: Works offline with sample fixtures when backend is unavailable

## Tech Stack

- **Frontend**: React + Vite + Material-UI
- **Backend**: Node.js + Fastify (optional - app works with frontend only)
- **AI**: OpenRouter API (DeepSeek V3.1)
- **Data Source**: The Sports DB API (free, no auth required)
- **Deployment**: Netlify (frontend), optional backend deployment

## Quick Start

### Frontend Only (Recommended for Demo)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd footy-prob/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenRouter API key
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

The app will run on `http://localhost:5173` with fallback data and AI predictions.

### Full Stack (Frontend + Backend)

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd footy-prob
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   # Add your API keys to both .env files
   ```

3. **Start both services**
   ```bash
   npm run dev
   ```

This starts both the backend API (port 3001) and frontend (port 5173).

### 1. Clone and Install
```bash
git clone https://github.com/your-username/footy-prob.git
cd footy-prob
npm install
cd frontend && npm install && cd ..
```

### 2. Environment Setup
```bash
# Frontend - add your OpenRouter API key
cp frontend/.env.example frontend/.env
# Edit frontend/.env and add your VITE_OPENROUTER_API_KEY
```

### 3. Run Development
```bash
# Start backend (port 3001)
npm start

# Start frontend (port 5173) - in another terminal
cd frontend && npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

- `GET /api/football-data/:league` - Get league data (results, standings, fixtures)
- `GET /api/analysis/:fixture_id` - Get enhanced match analysis
- `GET /api/leagues` - Get supported leagues
- `GET /api/fixtures/:league` - Get upcoming fixtures

## Deployment

### Netlify (Frontend)
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `frontend/dist` folder to Netlify
3. Add environment variable: `VITE_OPENROUTER_API_KEY`

### Render/Railway (Backend)
1. Deploy the root directory
2. Start command: `npm start`
3. The backend runs on the port specified by environment variable `PORT`

## Environment Variables

### Frontend (.env)
```
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Backend
No environment variables required - uses free The Sports DB API

## License

MIT
