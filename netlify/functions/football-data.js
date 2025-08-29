const { fetchRecentResultsWithGoalscorers, fetchCurrentStandings, fetchLiveFixtures, LEAGUES, extractLikelyGoalscorers } = require('../../api/utils.cjs');

function getLeagueKey(event) {
  // Try to extract league from path (e.g. /api/football-data/la-liga)
  const pathMatch = event.path && event.path.match(/football-data\/?([\w-]+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }
  // Fallback to query string
  if (event.queryStringParameters && event.queryStringParameters.league) {
    return event.queryStringParameters.league;
  }
  return 'premier-league';
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({})
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const league = getLeagueKey(event);
    if (!LEAGUES[league]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `League '${league}' not supported` })
      };
    }
    let recentResults, standings, fixtures, likely_goalscorers;
    try {
      [recentResults, standings, fixtures] = await Promise.all([
        fetchRecentResultsWithGoalscorers(league, 10),
        fetchCurrentStandings(league),
        fetchLiveFixtures(league)
      ]);
      likely_goalscorers = extractLikelyGoalscorers(recentResults);
    } catch (dataError) {
      console.error('Data fetch error:', dataError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Data fetch error', details: dataError.message })
      };
    }
    const responseBody = {
      league: LEAGUES[league].name,
      league_key: league,
      current_date: new Date().toISOString().split('T')[0],
      recent_results: recentResults.slice(0, 8),
      current_standings: standings,
      upcoming_fixtures: fixtures.slice(0, 10),
      likely_goalscorers,
      last_updated: new Date().toISOString()
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
