# Football Prediction App

A professional football prediction application using advanced statistical analysis and real-time data from The Sports DB API.

## Features

- **Real-time Football Data**: Live match results, standings, and fixtures for top European leagues
- **Advanced Statistical Analysis**: Enhanced Dixon-Coles model for accurate match predictions
- **Professional AI Analysis**: Detailed match breakdowns with expected goals and team ratings
- **Multi-League Support**: Premier League, La Liga, Bundesliga, Serie A, Ligue 1
- **Historical Data Integration**: Uses recent form across seasons for accurate analysis

## Tech Stack

- **Frontend**: React + Vite + Material-UI
- **Backend**: Node.js + Fastify
- **AI**: OpenRouter API (Claude 3.5 Sonnet)
- **Data Source**: The Sports DB API (free, no auth required)

## Quick Start

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
