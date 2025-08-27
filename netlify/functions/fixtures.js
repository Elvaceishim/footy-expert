const { fetchLiveFixtures, LEAGUES } = require('../../api/utils.cjs');

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
    const params = event.queryStringParameters || {};
    const league = params.league || 'premier-league';
    if (!LEAGUES[league]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `League '${league}' not supported` })
      };
    }
    const fixtures = await fetchLiveFixtures(league);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        league: LEAGUES[league]?.name,
        league_key: league,
        fixtures,
        total: fixtures.length
      })
    };
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
