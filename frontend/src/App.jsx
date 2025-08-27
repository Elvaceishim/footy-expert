import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, AppBar, Toolbar, Paper, TextField,
  Button, List, ListItem, Divider, Autocomplete, CircularProgress, 
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';

// Environment-based API key loading with graceful fallback
const getOpenRouterApiKey = () => {
  // Method 1: Vite environment variable (preferred for production)
  const viteKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (viteKey && viteKey.length > 10) {
    console.log('✅ Using Vite environment variable');
    return viteKey;
  }
  
  // Method 2: Check for any environment variables that might contain the key
  const allEnvKeys = Object.keys(import.meta.env);
  const potentialKeys = allEnvKeys.filter(key => 
    key.includes('OPENROUTER') || key.includes('API_KEY')
  );
  
  for (const key of potentialKeys) {
    const value = import.meta.env[key];
    if (value && value.startsWith('sk-or-v1-')) {
      console.log('✅ Found API key in:', key);
      return value;
    }
  }
  
  // Method 3: Return null to indicate no valid API key found
  console.warn('⚠️ No OpenRouter API key found in environment variables');
  console.warn('🔧 Please add VITE_OPENROUTER_API_KEY to your .env file');
  
  return null;
};

const OPENROUTER_API_KEY = getOpenRouterApiKey();
const API_BASE_URL = ''; // Use relative URLs to go through Vite proxy

// Comprehensive debug logging
console.log('🔍 App Initialization Debug:');
console.log('- Environment mode:', import.meta.env.MODE);
console.log('- Development build:', import.meta.env.DEV);
console.log('- Production build:', import.meta.env.PROD);
console.log('- Available VITE_ variables:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
console.log('- Direct VITE_OPENROUTER_API_KEY check:', import.meta.env.VITE_OPENROUTER_API_KEY ? 'PRESENT' : 'MISSING');

// Validate final API key
if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
  console.error('❌ No valid OpenRouter API key found!');
  console.error('🔧 Please get a new API key from https://openrouter.ai/');
} else {
  console.log('✅ API Key ready - length:', OPENROUTER_API_KEY.length);
  console.log('✅ API Key prefix:', OPENROUTER_API_KEY.substring(0, 15) + '...');
}

// Check if we're in development or production
const IS_PRODUCTION = import.meta.env.PROD;

// Dynamic backend availability check - will be set after testing API
let HAS_BACKEND = false;

// Enhanced helper: find match from chat text using flexible team name matching
function findMatchIdFromText(text, matches) {
  const lowerText = text.toLowerCase();
  
  for (const m of matches) {
    // First try exact label match
    if (lowerText.includes(m.label.toLowerCase())) {
      return m.id;
    }
    
    // Then try individual team name matching
    const teams = m.label.split(' vs ');
    if (teams.length === 2) {
      const homeTeam = teams[0].toLowerCase();
      const awayTeam = teams[1].toLowerCase();
      
      // Check for various team name patterns
      const teamVariations = [
        // Full names
        homeTeam, awayTeam,
        // Common abbreviations/nicknames
        homeTeam.split(' ')[0], awayTeam.split(' ')[0], // First word only
        homeTeam.replace(/united|city|football club|fc|town/g, '').trim(),
        awayTeam.replace(/united|city|football club|fc|town/g, '').trim()
      ];
      
      // Check if text contains references to both teams
      const homeFound = teamVariations.some(variation => 
        variation.length > 2 && lowerText.includes(variation)
      );
      const awayFound = teamVariations.some(variation => 
        variation.length > 2 && lowerText.includes(variation)
      );
      
      if (homeFound && awayFound) {
        return m.id;
      }
    }
  }
  return null;
}

function App() {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [errorMatches, setErrorMatches] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('premier-league');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Fallback data for production
  const FALLBACK_LEAGUES = [
    { id: 'premier-league', name: 'Premier League', country: 'England' },
    { id: 'la-liga', name: 'La Liga', country: 'Spain' },
    { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
    { id: 'serie-a', name: 'Serie A', country: 'Italy' },
    { id: 'ligue-1', name: 'Ligue 1', country: 'France' }
  ];

  const FALLBACK_MATCHES = {
    'premier-league': [
      { id: 1, home_team: 'Arsenal', away_team: 'Liverpool', date: '2025-08-30T15:00:00Z' },
      { id: 2, home_team: 'Manchester City', away_team: 'Chelsea', date: '2025-08-31T17:30:00Z' },
      { id: 3, home_team: 'Manchester United', away_team: 'Tottenham', date: '2025-09-01T14:00:00Z' },
      { id: 4, home_team: 'Newcastle', away_team: 'Brighton', date: '2025-09-02T16:00:00Z' }
    ],
    'la-liga': [
      { id: 11, home_team: 'Real Madrid', away_team: 'Barcelona', date: '2025-08-30T20:00:00Z' },
      { id: 12, home_team: 'Atletico Madrid', away_team: 'Sevilla', date: '2025-08-31T18:30:00Z' },
      { id: 13, home_team: 'Valencia', away_team: 'Villarreal', date: '2025-09-01T21:00:00Z' },
      { id: 14, home_team: 'Real Sociedad', away_team: 'Athletic Bilbao', date: '2025-09-02T19:00:00Z' }
    ],
    'bundesliga': [
      { id: 21, home_team: 'Bayern Munich', away_team: 'Borussia Dortmund', date: '2025-08-30T17:30:00Z' },
      { id: 22, home_team: 'RB Leipzig', away_team: 'Bayer Leverkusen', date: '2025-08-31T15:30:00Z' },
      { id: 23, home_team: 'Eintracht Frankfurt', away_team: 'Wolfsburg', date: '2025-09-01T17:00:00Z' },
      { id: 24, home_team: 'Borussia Monchengladbach', away_team: 'Schalke 04', date: '2025-09-02T15:30:00Z' }
    ],
    'serie-a': [
      { id: 31, home_team: 'Juventus', away_team: 'Inter Milan', date: '2025-08-30T19:00:00Z' },
      { id: 32, home_team: 'AC Milan', away_team: 'Napoli', date: '2025-08-31T20:45:00Z' },
      { id: 33, home_team: 'AS Roma', away_team: 'Lazio', date: '2025-09-01T17:00:00Z' },
      { id: 34, home_team: 'Atalanta', away_team: 'Fiorentina', date: '2025-09-02T19:30:00Z' }
    ],
    'ligue-1': [
      { id: 41, home_team: 'Paris Saint-Germain', away_team: 'Marseille', date: '2025-08-30T20:00:00Z' },
      { id: 42, home_team: 'Lyon', away_team: 'Monaco', date: '2025-08-31T19:00:00Z' },
      { id: 43, home_team: 'Lille', away_team: 'Nice', date: '2025-09-01T20:00:00Z' },
      { id: 44, home_team: 'Rennes', away_team: 'Nantes', date: '2025-09-02T17:00:00Z' }
    ]
  };

  // Check if backend is available
  const checkBackendAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues`, { 
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('Backend not available:', error.message);
      return false;
    }
  };

  // Load available leagues
  useEffect(() => {
    async function fetchLeagues() {
      try {
        // First check if backend is available
        const backendAvailable = await checkBackendAvailability();
        HAS_BACKEND = backendAvailable;
        
        if (!HAS_BACKEND) {
          console.log('Using fallback data - backend not available');
          setLeagues(FALLBACK_LEAGUES);
          return;
        }
        
        const res = await fetch(`${API_BASE_URL}/api/leagues`);
        const data = await res.json();
        setLeagues(data.leagues);
      } catch (e) {
        console.error('Failed to load leagues:', e);
        HAS_BACKEND = false;
        setLeagues(FALLBACK_LEAGUES); // Fallback to static data
      }
    }
    fetchLeagues();
  }, []);

  // Load fixtures from backend for selected league
  useEffect(() => {
    async function fetchMatches() {
      setLoadingMatches(true);
      try {
        if (!HAS_BACKEND) {
          const leagueMatches = FALLBACK_MATCHES[selectedLeague] || FALLBACK_MATCHES['premier-league'];
          const formatted = leagueMatches.map(f => ({
            label: `${f.home_team} vs ${f.away_team}`,
            id: f.id,
            league: selectedLeague,
            venue: 'Stadium',
            date: f.date
          }));
          setMatches(formatted);
          setLoadingMatches(false);
          return;
        }
        
        const res = await fetch(`${API_BASE_URL}/api/fixtures/${selectedLeague}`);
        const data = await res.json();
        // Expecting {fixtures: [{id, home_team, away_team, ...}]}
        const formatted = data.fixtures.map(f => ({
          label: `${f.home_team} vs ${f.away_team}`,
          id: f.id,
          league: f.league,
          venue: f.venue,
          date: f.date
        }));
        setMatches(formatted);
        setLoadingMatches(false);
      } catch (e) {
        console.error('Failed to load matches:', e);
        // Fallback to demo data
        const leagueMatches = FALLBACK_MATCHES[selectedLeague] || FALLBACK_MATCHES['premier-league'];
        const formatted = leagueMatches.map(f => ({
          label: `${f.home_team} vs ${f.away_team}`,
          id: f.id,
          league: selectedLeague,
          venue: 'Stadium',
          date: f.date
        }));
        setMatches(formatted);
        setErrorMatches('Using demo data - backend not available');
        setLoadingMatches(false);
      }
    }
    fetchMatches();
  }, [selectedLeague]);

  // Chat/assistant logic with real-time football data
  const handleSend = async () => {
    if (input.trim()) {
      setChat([...chat, { sender: 'user', text: input }]);
      setIsAiThinking(true);
      let aiReply = '';
      
      try {
        // Fetch real-time football data from our API
        const footballDataRes = await fetch(`${API_BASE_URL}/api/football-data/${selectedLeague}`);
        
        if (!footballDataRes.ok) {
          throw new Error(`API returned ${footballDataRes.status}: ${footballDataRes.statusText}`);
        }
        
        const footballData = await footballDataRes.json();
        
        // Create comprehensive real-time football context
        const realTimeFootballData = `
REAL-TIME FOOTBALL DATA - ${footballData.current_date}
LEAGUE: ${footballData.league}

RECENT ACTUAL MATCH RESULTS:
${footballData.recent_results?.map(match => {
  let matchStr = `${match.date}: ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} (${match.venue})`;
  
  // Add goalscorers if available
  if (match.home_goalscorers || match.away_goalscorers) {
    matchStr += '\n  Goalscorers:';
    if (match.home_goalscorers) {
      matchStr += ` ${match.home_team}: ${match.home_goalscorers}`;
    }
    if (match.away_goalscorers) {
      matchStr += ` ${match.away_team}: ${match.away_goalscorers}`;
    }
  }
  
  return matchStr;
}).join('\n\n') || 'No recent results available'}

CURRENT LEAGUE STANDINGS:
${footballData.current_standings?.map(team => 
  `${team.position}. ${team.team} - ${team.points} pts (${team.played} played, ${team.won}W ${team.drawn}D ${team.lost}L, GD: ${team.goal_difference})`
).join('\n') || 'Standings not available'}

UPCOMING FIXTURES:
${footballData.upcoming_fixtures?.map(fixture => 
  `${fixture.date}: ${fixture.home_team} vs ${fixture.away_team} (${fixture.venue})`
).join('\n') || 'No upcoming fixtures available'}

Last Updated: ${footballData.last_updated}`;

        // Professional expert prompt with real data
        const expertPrompt = `You are a professional football analyst with access to REAL, CURRENT football data.

${realTimeFootballData}

You have access to:
- Actual recent match results with real scores
- Current league standings with real points and positions
- Upcoming fixture list
- Real team performance data
- Some matches may include goalscorer information when available
- Advanced Dixon-Coles statistical model for match predictions

INSTRUCTIONS:
- Use ONLY the REAL data provided above to answer questions accurately
- When asked about recent matches, refer ONLY to the actual results shown
- When discussing team form, use ONLY the real recent results and standings provided
- When asked about league positions, use ONLY the current standings provided
- When analyzing specific upcoming fixtures, provide detailed statistical analysis based ONLY on the data provided
- Always specify that your information is current as of ${footballData.current_date}
- Focus on statistical analysis, team form, and tactical insights based ONLY on actual performance data shown
- DO NOT mention specific injury updates, transfers, or team news unless explicitly provided in the data above
- DO NOT make assumptions about player availability, suspensions, or squad changes
- DO NOT reference technical statistical models by name - keep methodology in background
- If asked about team news, acknowledge that you focus on statistical analysis rather than latest squad updates

IMPORTANT: If asked about a specific upcoming match, provide comprehensive statistical analysis including expected goals, team strength ratings, recent form, and tactical considerations based on actual performance data.

Provide factual, accurate analysis using this real data. Be professional, analytical, and data-driven while keeping the technical methodology in the background.

User question: ${input}`;

        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            model: "deepseek/deepseek-chat-v3.1",
            messages: [{ role: 'user', content: expertPrompt }],
            temperature: 0.2,
            max_tokens: 1000,
            reasoning_enabled: true  // Enable thinking mode for deeper analysis
          })
        });
        
        if (!aiRes.ok) {
          throw new Error(`AI API returned ${aiRes.status}: ${aiRes.statusText}`);
        }
        
        const aiData = await aiRes.json();
        
        aiReply = aiData.choices?.[0]?.message?.content || 'Analysis temporarily unavailable.';
        
      } catch (error) {
        // Fallback to limited analysis
        aiReply = `Unable to fetch current football data at the moment: ${error.message}. Please try again shortly.`;
      }

      // Try to extract match name and fetch prediction with detailed analysis
      const matchId = findMatchIdFromText(input, matches);
      if (matchId) {
        try {
          // Get detailed analysis for AI context
          const analysisRes = await fetch(`${API_BASE_URL}/api/analysis/${matchId}?league=${selectedLeague}`);
          const analysisData = await analysisRes.json();
          
          // Professional match analysis prompt with statistical data (no technical model references)
          const matchAnalysisPrompt = `You are a professional football analyst providing comprehensive match analysis using current 2025-26 season data and advanced statistical methodology:

MATCH: ${analysisData.match_details.teams}
VENUE: ${analysisData.match_details.venue}
LEAGUE: ${analysisData.match_details.league}
DATE: August 25, 2025

STATISTICAL ANALYSIS:
Expected Goals: Home ${analysisData.dixon_coles_analysis.expected_goals.home} - Away ${analysisData.dixon_coles_analysis.expected_goals.away}

TEAM PERFORMANCE RATINGS:
- Home Team Attack Strength: ${analysisData.dixon_coles_analysis.team_ratings.home_attack}
- Home Team Defensive Solidity: ${analysisData.dixon_coles_analysis.team_ratings.home_defense}
- Away Team Attack Strength: ${analysisData.dixon_coles_analysis.team_ratings.away_attack}
- Away Team Defensive Solidity: ${analysisData.dixon_coles_analysis.team_ratings.away_defense}
- Home Advantage Factor: ${analysisData.dixon_coles_analysis.team_ratings.home_advantage}

RECENT FORM DATA (Last 5 Matches):
- Home Team: ${analysisData.dixon_coles_analysis.recent_form_stats.home_last5_goals} goals scored, ${analysisData.dixon_coles_analysis.recent_form_stats.home_last5_conceded} conceded
- Away Team: ${analysisData.dixon_coles_analysis.recent_form_stats.away_last5_goals} goals scored, ${analysisData.dixon_coles_analysis.recent_form_stats.away_last5_conceded} conceded

VENUE PERFORMANCE:
- Home wins at venue: ${analysisData.dixon_coles_analysis.venue_performance.home_wins_at_venue}/${analysisData.dixon_coles_analysis.venue_performance.home_matches_at_venue} (${analysisData.dixon_coles_analysis.venue_performance.home_win_rate})

CURRENT SEASON FORM (2025-26):
- ${analysisData.match_details.teams.split(' vs ')[0]}: ${analysisData.form_analysis.home_team.last_5_games} (${analysisData.form_analysis.home_team.points} pts from last 5)
- ${analysisData.match_details.teams.split(' vs ')[1]}: ${analysisData.form_analysis.away_team.last_5_games} (${analysisData.form_analysis.away_team.points} pts from last 5)

HEAD-TO-HEAD: ${analysisData.head_to_head.last_5_meetings} | Avg goals: ${analysisData.head_to_head.avg_goals_per_game}

TACTICAL INSIGHTS:
- Home style: ${analysisData.tactical_insight.home_style}
- Away style: ${analysisData.tactical_insight.away_style}

VENUE FACTOR: ${analysisData.venue_factors}

MATCH PROBABILITIES:
- Home Win: ${analysisData.predictions.home_win}
- Draw: ${analysisData.predictions.draw}
- Away Win: ${analysisData.predictions.away_win}

IMPORTANT INSTRUCTIONS:
- DO NOT mention specific player injuries, transfers, or team news unless you have concrete verified data
- DO NOT reference technical model names or statistical methodologies by name  
- DO NOT make assumptions about player availability, suspensions, or recent transfers
- Focus on the statistical evidence and performance data provided
- Base tactical analysis only on playing styles and recent form patterns shown in the data
- If asked about team news, explain you focus on statistical analysis rather than squad updates
- Avoid speculating about individual player situations

Provide a comprehensive analysis explaining:
1. STATISTICAL BREAKDOWN: What the performance ratings and expected goals indicate
2. RECENT FORM IMPACT: How current season form affects the prediction
3. VENUE ADVANTAGE: Impact of home/away factors and venue performance
4. TACTICAL CONSIDERATIONS: Key matchups based on playing styles and statistical patterns
5. FINAL PREDICTION: Your score prediction with confidence level and statistical reasoning

Be analytical and data-driven while keeping technical methodology in the background. Focus on what the numbers tell us about likely match outcomes.

User's specific question: ${input}`;

          try {
            const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                model: "deepseek/deepseek-chat-v3.1",
                messages: [{ role: 'user', content: matchAnalysisPrompt }],
                temperature: 0.7,
                max_tokens: 1000,
                reasoning_enabled: true  // Enable thinking mode for deeper analysis
              })
            });
            const aiData = await aiRes.json();
            const expertAnalysis = aiData.choices?.[0]?.message?.content || 'Analysis temporarily unavailable.';
            
            setChat(prev => [...prev, {
              sender: 'assistant',
              text: expertAnalysis
            }]);
          } catch (e) {
            // Fallback to basic prediction display
            const basicAnalysis = `� **THE PROPHET'S QUICK INSIGHT**\n\n` +
              `📊 **${analysisData.match_details.teams}**\n` +
              `🏟️ ${analysisData.match_details.venue} | 🏆 ${analysisData.match_details.league}\n\n` +
              `📈 **FORM GUIDE:**\n` +
              `🏠 Home: ${analysisData.form_analysis.home_team.last_5_games} (${analysisData.form_analysis.home_team.goals_scored_l5} goals scored)\n` +
              `✈️ Away: ${analysisData.form_analysis.away_team.last_5_games} (${analysisData.form_analysis.away_team.goals_scored_l5} goals scored)\n\n` +
              `🎯 **PREDICTIONS:**\n` +
              `🏠 Home Win: **${analysisData.predictions.home_win}**\n` +
              `🤝 Draw: **${analysisData.predictions.draw}**\n` +
              `✈️ Away Win: **${analysisData.predictions.away_win}**\n\n` +
              `💡 **QUICK TAKE:** ${analysisData.betting_insights.value_spots}`;
            
            setChat(prev => [...prev, {
              sender: 'assistant',
              text: basicAnalysis
            }]);
          }
        } catch (e) {
          setChat(prev => [...prev, {
            sender: 'assistant',
            text: `${aiReply}\n\n❌ Unable to fetch detailed match analysis. The Genie's crystal ball is cloudy right now!`
          }]);
        }
      } else {
        setChat(prev => [...prev, { sender: 'assistant', text: aiReply }]);
      }
      
      setIsAiThinking(false);
      setInput('');
    }
  };

  // AI-based prediction for selected match
  const handlePredict = async () => {
    if (!selectedMatch) return;
    
    if (!OPENROUTER_API_KEY) {
      setPrediction({ 
        error: 'OpenRouter API key not configured',
        analysis: 'Please add your OpenRouter API key to use AI predictions.'
      });
      return;
    }

    try {
      setIsAiThinking(true);
      
      const homeTeam = selectedMatch.label.split(' vs ')[0];
      const awayTeam = selectedMatch.label.split(' vs ')[1];
      
      const predictionPrompt = `You are a professional football analyst. Analyze the upcoming match between ${homeTeam} vs ${awayTeam} in the ${selectedLeague.replace('-', ' ')}.

Please provide a comprehensive match analysis with:

**MATCH PREDICTION:**
- Home Win: [X]%
- Draw: [X]%  
- Away Win: [X]%

**DETAILED REASONING:**

1. **Current Form Analysis**
   - ${homeTeam}'s recent performances
   - ${awayTeam}'s recent performances

2. **Head-to-Head Record**
   - Historical matchups between these teams
   - Recent meetings and patterns

3. **Key Factors**
   - Home advantage
   - Squad strength and injuries
   - Tactical matchups
   - Motivation levels

4. **Final Assessment**
   - Why you predict this outcome
   - Main deciding factors
   - Confidence level in prediction

Be detailed, analytical, and provide clear reasoning for your probability predictions.`;

      // Debug the API key right before the call
      console.log('🔍 API Call Debug:');
      console.log('- API Key exists:', !!OPENROUTER_API_KEY);
      console.log('- API Key length:', OPENROUTER_API_KEY?.length);
      console.log('- API Key starts with sk-or-v1-:', OPENROUTER_API_KEY?.startsWith('sk-or-v1-'));
      console.log('- API Key first 20 chars:', OPENROUTER_API_KEY?.substring(0, 20));
      
      // Validate API key format before making the call
      if (!OPENROUTER_API_KEY || !OPENROUTER_API_KEY.startsWith('sk-or-v1-') || OPENROUTER_API_KEY.length < 50) {
        throw new Error(`Invalid API key format. Length: ${OPENROUTER_API_KEY?.length}, Valid format: ${OPENROUTER_API_KEY?.startsWith('sk-or-v1-')}`);
      }

      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          model: "deepseek/deepseek-chat-v3.1",
          messages: [{ role: 'user', content: predictionPrompt }],
          temperature: 0.7,
          max_tokens: 1500,
          reasoning_enabled: true  // Enable thinking mode for deeper analysis
        })
      });

      // Enhanced error handling with response details
      if (!aiRes.ok) {
        const errorData = await aiRes.text();
        console.error('🚨 API Error Details:', {
          status: aiRes.status,
          statusText: aiRes.statusText,
          headers: Object.fromEntries(aiRes.headers.entries()),
          body: errorData
        });
        
        if (aiRes.status === 401) {
          // Check if it's a "User not found" error (invalid API key)
          if (errorData.includes('User not found')) {
            throw new Error('Invalid OpenRouter API key - User not found. Please get a new API key from https://openrouter.ai/');
          } else {
            throw new Error('Invalid or missing OpenRouter API key');
          }
        } else if (aiRes.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later');
        } else {
          throw new Error(`API error: ${aiRes.status} ${aiRes.statusText} - ${errorData}`);
        }
      }

      const aiData = await aiRes.json();
      const analysis = aiData.choices?.[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis received from AI');
      }
      
      // Extract probabilities from AI response (improved regex matching)
      const homeMatch = analysis.match(/home.*?win.*?(\d+)%/i) || analysis.match(/(\d+)%.*?home/i);
      const drawMatch = analysis.match(/draw.*?(\d+)%/i);
      const awayMatch = analysis.match(/away.*?win.*?(\d+)%/i) || analysis.match(/(\d+)%.*?away/i);
      
      const homePct = homeMatch ? parseInt(homeMatch[1]) : 40;
      const drawPct = drawMatch ? parseInt(drawMatch[1]) : 25;
      const awayPct = awayMatch ? parseInt(awayMatch[1]) : 35;
      
      setPrediction({
        fixture_id: selectedMatch.id,
        home_team: homeTeam,
        away_team: awayTeam,
        league: selectedLeague,
        predictions: {
          home_win: (homePct / 100).toFixed(3),
          draw: (drawPct / 100).toFixed(3),
          away_win: (awayPct / 100).toFixed(3)
        },
        analysis: {
          full_analysis: analysis,
          confidence: 'AI Analysis'
        }
      });
      
    } catch (error) {
      console.error('AI prediction error:', error);
      const homeTeam = selectedMatch.label.split(' vs ')[0];
      const awayTeam = selectedMatch.label.split(' vs ')[1];
      
      let errorMessage = 'Unable to generate AI prediction';
      let detailedAnalysis = `Failed to analyze ${homeTeam} vs ${awayTeam}.`;
      
      if (error.message.includes('User not found')) {
        errorMessage = 'Invalid API Key';
        detailedAnalysis = `❌ **API Key Invalid**\n\nThe OpenRouter API key is not valid or has expired.\n\n**To fix this:**\n\n1. 🌐 Visit https://openrouter.ai/\n2. 🔑 Create an account and get a new API key\n3. 💰 Add some credits to your account\n4. 📝 Update your .env file with: VITE_OPENROUTER_API_KEY=your_new_key\n5. 🔄 Restart the application\n\n**Note:** OpenRouter requires a valid account with credits to use their AI models.`;
      } else if (error.message.includes('Invalid or missing OpenRouter API key')) {
        errorMessage = 'API Key Required';
        detailedAnalysis = `To get AI predictions for ${homeTeam} vs ${awayTeam}, you need to:\n\n1. Get an API key from https://openrouter.ai/\n2. Add it to your environment variables as VITE_OPENROUTER_API_KEY\n3. Restart the application\n\nThe API key enables access to advanced AI analysis for match predictions.`;
      } else if (error.message.includes('Rate limit exceeded')) {
        detailedAnalysis = `Rate limit exceeded for ${homeTeam} vs ${awayTeam}.\n\nPlease wait a few minutes before requesting another prediction.`;
      } else {
        detailedAnalysis = `Failed to analyze ${homeTeam} vs ${awayTeam}.\n\nError: ${error.message}\n\nThis could be due to:\n• Invalid or expired API key\n• Network connectivity issues\n• API service problems\n• Rate limiting\n\nPlease check your OpenRouter API key and try again.`;
      }
      
      setPrediction({ 
        error: errorMessage,
        analysis: {
          full_analysis: detailedAnalysis
        }
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: { xs: '0', md: '3rem' },
      maxWidth: { xs: '100vw', md: '1200px' },
    }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Football Expert - Professional Match Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      <Box mt={4} width="100%">
        {/* Chat Section */}
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Football Expert Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
            Professional football analyst with real-time access to match results, current standings, and fixture data. 
            Your one-stop shop for accurate football analysis and predictions.
          </Typography>
          
          {/* Example conversation starters */}
          {chat.length === 0 && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                Example questions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  'What was Arsenal\'s last match result?',
                  'Show me the current Premier League standings',
                  'How is Manchester City performing this season?',
                  'Who scored in Chelsea\'s recent matches?'
                ].map((example, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant="outlined"
                    onClick={() => setInput(example)}
                    sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                  >
                    "{example}"
                  </Button>
                ))}
              </Box>
            </Box>
          )}
          
          <List sx={{ minHeight: 120, maxHeight: 350, overflowY: 'auto', mb: 2 }}>
            {chat.length === 0 && !isAiThinking && (
              <ListItem>
                <Typography variant="body1" color="secondary" sx={{ fontStyle: 'italic' }}>
                  <b>Football Expert:</b> Hello! I'm your professional football analyst. 
                  
                  You can ask me anything about recent match results, current standings, team form, or upcoming fixtures. What would you like to know?
                </Typography>
              </ListItem>
            )}
            
            {/* Loading state when AI is thinking */}
            {isAiThinking && (
              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body1" color="secondary" sx={{ fontStyle: 'italic' }}>
                    <b>Football Expert:</b> {[
                      'Fetching real-time match results and standings...',
                      'Accessing current league data and team statistics...',
                      'Processing latest football results and fixtures...',
                      'Analyzing current team form and performance data...',
                      'Retrieving up-to-date football information...'
                    ][Math.floor(Math.random() * 5)]}
                  </Typography>
                </Box>
              </ListItem>
            )}
            
            {chat.map((msg, idx) => (
              <ListItem key={idx} alignItems="flex-start">
                <Typography
                  variant="body1"
                  color={msg.sender === 'user' ? 'primary' : 'secondary'}
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  <b>{msg.sender === 'user' ? 'You' : 'Football Expert'}:</b> {msg.text}
                </Typography>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              fullWidth
              label="Ask the Football Expert... (e.g., 'What was Arsenal's last match result?')"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isAiThinking && handleSend()}
              multiline
              maxRows={3}
              disabled={isAiThinking}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              sx={{ minWidth: 120, height: 56 }}
              disabled={!input.trim() || isAiThinking}
            >
              {isAiThinking ? 'Analyzing...' : 'Ask Expert'}
            </Button>
          </Box>
        </Paper>

        {/* Prediction Section */}
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography variant="h5" gutterBottom>Match Prediction</Typography>
          
          {/* League Selector */}
          <Box mb={2}>
            <FormControl fullWidth>
              <InputLabel>Select League</InputLabel>
              <Select
                value={selectedLeague}
                label="Select League"
                onChange={(e) => setSelectedLeague(e.target.value)}
              >
                {leagues.map((league) => (
                  <MenuItem key={league.key} value={league.key}>
                    {league.country === 'England' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' : 
                     league.country === 'Spain' ? '🇪🇸' :
                     league.country === 'Germany' ? '🇩🇪' :
                     league.country === 'Italy' ? '🇮🇹' :
                     league.country === 'France' ? '🇫🇷' : '⚽'} {league.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={2}>
            {loadingMatches ? (
              <CircularProgress />
            ) : errorMatches ? (
              <Typography color="error">{errorMatches}</Typography>
            ) : (
              <Autocomplete
                options={matches}
                getOptionLabel={option => option.label}
                value={selectedMatch}
                onChange={(_, value) => setSelectedMatch(value)}
                renderInput={params => <TextField {...params} label="Search for a match..." />}
                sx={{ flex: 1 }}
              />
            )}
            <Button
              variant="contained"
              onClick={handlePredict}
              sx={{ minWidth: 120, height: 56 }}
            >
              Get Prediction
            </Button>
          </Box>
          {prediction && (
            <Box mt={2}>
              {prediction.error ? (
                <Box>
                  <Typography color="error">
                    {prediction.error}
                  </Typography>
                  {prediction.analysis?.full_analysis && (
                    <Box mt={1} sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'text.secondary' }}>
                      {prediction.analysis.full_analysis}
                    </Box>
                  )}
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    🏟️ {prediction.home_team} vs {prediction.away_team}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {prediction.league?.replace('-', ' ')} • AI Analysis
                  </Typography>
                  <Box mt={2}>
                    <Typography>🏠 Home Win ({prediction.home_team}): <b>{(prediction.predictions.home_win * 100).toFixed(1)}%</b></Typography>
                    <Typography>🤝 Draw: <b>{(prediction.predictions.draw * 100).toFixed(1)}%</b></Typography>
                    <Typography>✈️ Away Win ({prediction.away_team}): <b>{(prediction.predictions.away_win * 100).toFixed(1)}%</b></Typography>
                  </Box>
                  {prediction.analysis?.full_analysis && (
                    <Box mt={2} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                      {prediction.analysis.full_analysis}
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Generated at {new Date().toLocaleString()}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
