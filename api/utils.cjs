const axios = require('axios');

// The Sports DB API client (FREE, no auth required!)
const sportsDB = axios.create({
  baseURL: 'https://www.thesportsdb.com/api/v1/json/3',
  timeout: 10000
});

// Simple leagues configuration
const LEAGUES = {
  'premier-league': { id: '4328', name: 'English Premier League', country: 'England', season: '2025-2026' },
  'la-liga': { id: '4335', name: 'Spanish La Liga', country: 'Spain', season: '2025-2026' },
  'bundesliga': { id: '4331', name: 'German Bundesliga', country: 'Germany', season: '2025-2026' },
  'serie-a': { id: '4332', name: 'Italian Serie A', country: 'Italy', season: '2025-2026' },
  'ligue-1': { id: '4334', name: 'French Ligue 1', country: 'France', season: '2025-2026' }
};

async function fetchLiveFixtures(leagueKey = 'premier-league') {
  const league = LEAGUES[leagueKey];
  if (!league) throw new Error(`League '${leagueKey}' not supported`);

  try {
    console.log(`🔄 Fetching ${league.name} fixtures...`);
    const response = await sportsDB.get(`/eventsseason.php?id=${league.id}&s=${league.season}`);
    
    const fixtures = response.data.events
      ?.filter(event => new Date(event.dateEvent + 'T' + (event.strTime || '15:00:00')) > new Date())
      .slice(0, 20)
      .map(event => ({
        id: event.idEvent,
        home_team: event.strHomeTeam,
        away_team: event.strAwayTeam,
        date: event.dateEvent + 'T' + (event.strTime || '15:00:00') + ':00.000Z',
        status: 'NS',
        venue: event.strVenue || 'TBD',
        league: league.name,
        country: league.country
      })) || [];

    console.log(`✅ Loaded ${fixtures.length} fixtures for ${league.name}`);
    return fixtures;
  } catch (error) {
    console.error(`❌ Failed to fetch ${league.name} fixtures:`, error.message);
    return [];
  }
}

async function fetchRecentResults(leagueKey = 'premier-league', minMatches = 5) {
  const league = LEAGUES[leagueKey];
  if (!league) throw new Error(`League '${leagueKey}' not supported`);

  try {
    console.log(`🔄 Fetching ${league.name} recent results...`);
    
    let allResults = [];
    const seasons = ['2025-2026', '2024-2025']; // Search current and previous season
    
    for (const season of seasons) {
      if (allResults.length >= 100) break; // Enough data collected
      
      console.log(`Fetching ${season} results...`);
      const response = await sportsDB.get(`/eventsseason.php?id=${league.id}&s=${season}`);
      
      if (response.data.events && response.data.events.length > 0) {
        const seasonResults = response.data.events
          .filter(event => {
            // Filter for completed matches
            return event.intHomeScore !== null && event.intAwayScore !== null;
          })
          .sort((a, b) => new Date(b.dateEvent) - new Date(a.dateEvent)) // Sort by most recent
          .map(event => ({
            id: event.idEvent,
            date: event.dateEvent,
            home_team: event.strHomeTeam,
            away_team: event.strAwayTeam,
            home_score: parseInt(event.intHomeScore) || 0,
            away_score: parseInt(event.intAwayScore) || 0,
            venue: event.strVenue || 'TBD',
            league: league.name,
            country: league.country,
            season: season,
            matchday: event.intRound || 'Unknown'
          }));
        
        allResults.push(...seasonResults);
        console.log(`✅ Added ${seasonResults.length} results from ${season}`);
      }
    }
    
    // Sort all results by date (most recent first) and take what we need
    allResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentResults = allResults.slice(0, Math.max(minMatches * 4, 50)); // Get enough for multiple teams' recent form
    
    console.log(`✅ Total recent results loaded: ${recentResults.length} for ${league.name}`);
    return recentResults;
  } catch (error) {
    console.error(`❌ Failed to fetch ${league.name} recent results:`, error.message);
    return [];
  }
}

async function fetchRecentResultsWithGoalscorers(leagueKey = 'premier-league', minMatches = 5) {
  const league = LEAGUES[leagueKey];
  if (!league) throw new Error(`League '${leagueKey}' not supported`);

  try {
    console.log(`🔄 Fetching ${league.name} recent results with goalscorers...`);
    let allResults = [];
    const seasons = ['2025-2026', '2024-2025'];
    for (const season of seasons) {
      if (allResults.length >= 100) break;
      const response = await sportsDB.get(`/eventsseason.php?id=${league.id}&s=${season}`);
      if (response.data.events && response.data.events.length > 0) {
        const seasonResults = response.data.events
          .filter(event => event.intHomeScore !== null && event.intAwayScore !== null)
          .sort((a, b) => new Date(b.dateEvent) - new Date(a.dateEvent))
          .map(event => ({
            id: event.idEvent,
            date: event.dateEvent,
            home_team: event.strHomeTeam,
            away_team: event.strAwayTeam,
            home_score: parseInt(event.intHomeScore) || 0,
            away_score: parseInt(event.intAwayScore) || 0,
            venue: event.strVenue || 'TBD',
            league: league.name,
            country: league.country,
            season: season,
            matchday: event.intRound || 'Unknown',
            home_goalscorers: event.strHomeGoalDetails || '',
            away_goalscorers: event.strAwayGoalDetails || ''
          }));
        allResults.push(...seasonResults);
        console.log(`✅ Added ${seasonResults.length} results from ${season}`);
      }
    }
    allResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentResults = allResults.slice(0, Math.max(minMatches * 4, 50));
    console.log(`✅ Total recent results loaded: ${recentResults.length} for ${league.name}`);
    return recentResults;
  } catch (error) {
    console.error(`❌ Failed to fetch ${league.name} recent results:`, error.message);
    return [];
  }
}

function extractLikelyGoalscorers(recentResults) {
  // Aggregate goalscorers from recent matches
  const scorerMap = {};
  recentResults.forEach(match => {
    // Home team
    if (match.home_goalscorers) {
      match.home_goalscorers.split(';').forEach(scorer => {
        const name = scorer.split('(')[0].trim();
        if (!name) return;
        scorerMap[name] = (scorerMap[name] || 0) + 1;
      });
    }
    // Away team
    if (match.away_goalscorers) {
      match.away_goalscorers.split(';').forEach(scorer => {
        const name = scorer.split('(')[0].trim();
        if (!name) return;
        scorerMap[name] = (scorerMap[name] || 0) + 1;
      });
    }
  });
  // Sort by goals scored
  const sortedScorers = Object.entries(scorerMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, goals]) => ({ name, goals }));
  return sortedScorers.slice(0, 10); // Top 10
}

async function fetchCurrentStandings(leagueKey = 'premier-league') {
  const league = LEAGUES[leagueKey];
  if (!league) throw new Error(`League '${leagueKey}' not supported`);

  try {
    console.log(`🔄 Fetching ${league.name} current standings...`);
    
    // Force current season 2025-2026 first
    let response;
    let season = '2025-2026'; // Force current season
    
    response = await sportsDB.get(`/lookuptable.php?l=${league.id}&s=${season}`);
    
    if (!response.data.table || response.data.table.length === 0) {
      console.log(`No standings for ${season}, trying 2024-2025...`);
      season = '2024-2025';
      response = await sportsDB.get(`/lookuptable.php?l=${league.id}&s=${season}`);
    }
    
    const standings = response.data.table
      ?.sort((a, b) => parseInt(a.intRank) - parseInt(b.intRank))
      .map(team => ({
        position: parseInt(team.intRank),
        team: team.strTeam,
        played: parseInt(team.intPlayed) || 0,
        won: parseInt(team.intWin) || 0,
        drawn: parseInt(team.intDraw) || 0,
        lost: parseInt(team.intLoss) || 0,
        goals_for: parseInt(team.intGoalsFor) || 0,
        goals_against: parseInt(team.intGoalsAgainst) || 0,
        goal_difference: (parseInt(team.intGoalsFor) || 0) - (parseInt(team.intGoalsAgainst) || 0),
        points: parseInt(team.intPoints) || 0,
        season: season
      })) || [];

    console.log(`✅ Loaded standings with ${standings.length} teams for ${league.name} (${season})`);
    return standings;
  } catch (error) {
    console.error(`❌ Failed to fetch ${league.name} standings:`, error.message);
    return [];
  }
}

module.exports = {
  LEAGUES,
  fetchLiveFixtures,
  fetchRecentResults,
  fetchCurrentStandings,
  fetchRecentResultsWithGoalscorers,
  extractLikelyGoalscorers
};
