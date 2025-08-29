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
      console.log('League not supported:', league);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `League '${league}' not supported` })
      };
    }
    let fixtures = [];
    try {
      fixtures = await fetchLiveFixtures(league);
      if (!Array.isArray(fixtures)) fixtures = [];
      console.log('Fetched fixtures:', JSON.stringify(fixtures, null, 2));
    } catch (fetchError) {
      console.error('Error in fetchLiveFixtures:', fetchError);
      fixtures = [];
    }
    const responseBody = { league, league_key: league, fixtures, total: fixtures.length };
    console.log('Returning response body:', JSON.stringify(responseBody, null, 2));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseBody)
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
