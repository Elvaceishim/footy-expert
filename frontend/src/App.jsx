import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, AppBar, Toolbar, Paper, TextField,
  Button, List, ListItem, Divider, Autocomplete, CircularProgress, 
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_BASE_URL = ''; // Use relative URLs to go through Vite proxy

// Check if we're in development or production
const IS_PRODUCTION = import.meta.env.PROD;
const HAS_BACKEND = !IS_PRODUCTION; // Assume no backend in production for now

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

  const FALLBACK_MATCHES = [
    { id: 1, home_team: 'Arsenal', away_team: 'Liverpool', date: '2025-08-30T15:00:00Z' },
    { id: 2, home_team: 'Manchester City', away_team: 'Chelsea', date: '2025-08-31T17:30:00Z' },
    { id: 3, home_team: 'Manchester United', away_team: 'Tottenham', date: '2025-09-01T14:00:00Z' }
  ];

  // Load available leagues
  useEffect(() => {
    async function fetchLeagues() {
      try {
        if (!HAS_BACKEND) {
          setLeagues(FALLBACK_LEAGUES);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/leagues`);
        const data = await res.json();
        setLeagues(data.leagues);
      } catch (e) {
        console.error('Failed to load leagues:', e);
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
          const formatted = FALLBACK_MATCHES.map(f => ({
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
        const formatted = FALLBACK_MATCHES.map(f => ({
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
            model: "anthropic/claude-3.5-sonnet",
            messages: [{ role: 'user', content: expertPrompt }],
            temperature: 0.2,
            max_tokens: 1000
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
                model: "anthropic/claude-3.5-sonnet",
                messages: [{ role: 'user', content: matchAnalysisPrompt }],
                temperature: 0.7,
                max_tokens: 1000
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

  // Prediction fetch based on selected match
  const handlePredict = async () => {
    if (selectedMatch) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/predict?fixture_id=${selectedMatch.id}&league=${selectedLeague}`);
        const data = await res.json();
        setPrediction(data);
      } catch (e) {
        setPrediction({ error: 'Failed to fetch prediction' });
      }
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
          <Typography variant="h5" gutterBottom>Match Probability Prediction</Typography>
          
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
                <Typography color="error">{prediction.error}</Typography>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    🏟️ {prediction.home_team} vs {prediction.away_team}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {prediction.league} • {prediction.venue}
                  </Typography>
                  <Box mt={2}>
                    <Typography>🏠 Home Win ({prediction.home_team}): <b>{(prediction.p_home * 100).toFixed(1)}%</b></Typography>
                    <Typography>🤝 Draw: <b>{(prediction.p_draw * 100).toFixed(1)}%</b></Typography>
                    <Typography>✈️ Away Win ({prediction.away_team}): <b>{(prediction.p_away * 100).toFixed(1)}%</b></Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Generated: {new Date(prediction.generated_at).toLocaleString()}
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
