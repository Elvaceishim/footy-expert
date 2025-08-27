const { LEAGUES } = require('../../api/utils.cjs');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
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
    const leagues = Object.entries(LEAGUES).map(([key, league]) => ({
      key,
      name: league.name,
      country: league.country
    }));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ leagues })
    };
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
