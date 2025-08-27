function poisson(lambda, k) {
  // naive Poisson pmf
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}
function factorial(n){ return n<=1 ? 1 : n*factorial(n-1); }

// Dixon-Coles correlation function for low-scoring games
function dixonColesCorrection(homeGoals, awayGoals, lambdaHome, lambdaAway, rho = 0.1) {
  if (homeGoals > 1 || awayGoals > 1) {
    return 1; // No correction for high-scoring outcomes
  }
  
  // Correction factors for 0-0, 1-0, 0-1, 1-1
  const corrections = {
    '0-0': 1 - lambdaHome * lambdaAway * rho,
    '1-0': 1 + lambdaAway * rho,
    '0-1': 1 + lambdaHome * rho,
    '1-1': 1 - rho
  };
  
  const key = `${homeGoals}-${awayGoals}`;
  return corrections[key] || 1;
}

// Calculate team attack rating based on recent form and season data
function calculateAttackRating(teamStats) {
  const { 
    goalsFor = 0, 
    matchesPlayed = 1, 
    last5Goals = 0, 
    last5Matches = 1,
    homeGoalsFor = 0,
    homeMatches = 1 
  } = teamStats;
  
  // Season average goals per game
  const seasonAvg = goalsFor / Math.max(matchesPlayed, 1);
  
  // Recent form (last 5 games) - weighted more heavily
  const recentForm = last5Goals / Math.max(last5Matches, 1);
  
  // Home scoring rate (for home teams)
  const homeRate = homeGoalsFor / Math.max(homeMatches, 1);
  
  // Weighted combination: 40% recent form, 35% season avg, 25% home rate
  const attackRating = (recentForm * 0.4) + (seasonAvg * 0.35) + (homeRate * 0.25);
  
  // Minimum threshold to avoid zero values
  return Math.max(attackRating, 0.5);
}

// Calculate team defense rating based on recent form and season data
function calculateDefenseRating(teamStats) {
  const { 
    goalsAgainst = 0, 
    matchesPlayed = 1, 
    last5Conceded = 0, 
    last5Matches = 1,
    awayGoalsAgainst = 0,
    awayMatches = 1 
  } = teamStats;
  
  // Season average goals conceded per game
  const seasonAvg = goalsAgainst / Math.max(matchesPlayed, 1);
  
  // Recent form (last 5 games)
  const recentForm = last5Conceded / Math.max(last5Matches, 1);
  
  // Away conceding rate (for away teams)
  const awayRate = awayGoalsAgainst / Math.max(awayMatches, 1);
  
  // Weighted combination: 40% recent form, 35% season avg, 25% away rate
  const defenseRating = (recentForm * 0.4) + (seasonAvg * 0.35) + (awayRate * 0.25);
  
  // Minimum threshold to avoid zero values
  return Math.max(defenseRating, 0.5);
}

// Calculate venue-specific home advantage factor
function calculateHomeAdvantage(venueStats, homeTeam) {
  const {
    homeWins = 0,
    homeDraws = 0,
    homeLosses = 0,
    homeGoalsFor = 0,
    homeGoalsAgainst = 0,
    totalHomeMatches = 1
  } = venueStats;
  
  // Home win percentage
  const homeWinRate = homeWins / Math.max(totalHomeMatches, 1);
  
  // Home goal scoring rate vs conceding rate
  const homeGoalDiff = (homeGoalsFor - homeGoalsAgainst) / Math.max(totalHomeMatches, 1);
  
  // Base home advantage (typically 1.3-1.4 for most venues)
  let homeAdvantage = 1.35;
  
  // Adjust based on actual home performance
  if (homeWinRate > 0.6) {
    homeAdvantage += 0.15; // Strong home record
  } else if (homeWinRate < 0.3) {
    homeAdvantage -= 0.15; // Poor home record
  }
  
  // Adjust based on goal difference at home
  if (homeGoalDiff > 1.0) {
    homeAdvantage += 0.1; // Dominant at home
  } else if (homeGoalDiff < -0.5) {
    homeAdvantage -= 0.1; // Struggle at home
  }
  
  // Ensure reasonable bounds
  return Math.max(Math.min(homeAdvantage, 1.8), 1.0);
}

// Enhanced Dixon-Coles prediction with dynamic parameters
function predictProbs({ 
  homeAttack, 
  homeDefense, 
  awayAttack, 
  awayDefense, 
  homeAdvantage = 1.35,
  leagueAverage = 1.4,
  rho = 0.1,
  maxGoals = 6 
}) {
  // Calculate expected goals using Dixon-Coles formula
  const lambdaHome = homeAttack * awayDefense * homeAdvantage * leagueAverage;
  const lambdaAway = awayAttack * homeDefense * leagueAverage;
  
  // Calculate probabilities with Dixon-Coles correlation corrections
  let pHome = 0, pDraw = 0, pAway = 0;
  
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      // Base Poisson probability
      let prob = poisson(lambdaHome, i) * poisson(lambdaAway, j);
      
      // Apply Dixon-Coles correlation correction
      const correction = dixonColesCorrection(i, j, lambdaHome, lambdaAway, rho);
      prob *= correction;
      
      // Accumulate probabilities
      if (i > j) {
        pHome += prob;
      } else if (i === j) {
        pDraw += prob;
      } else {
        pAway += prob;
      }
    }
  }
  
  // Normalize probabilities to ensure they sum to 1
  const total = pHome + pDraw + pAway;
  
  return {
    p_home: pHome / total,
    p_draw: pDraw / total,
    p_away: pAway / total,
    expected_goals_home: lambdaHome,
    expected_goals_away: lambdaAway,
    model_parameters: {
      home_attack: homeAttack,
      home_defense: homeDefense,
      away_attack: awayAttack,
      away_defense: awayDefense,
      home_advantage: homeAdvantage,
      correlation_factor: rho
    }
  };
}

// Legacy function for backward compatibility with static lambdas
function predictProbsStatic({ lambdaHome, lambdaAway, maxGoals = 6 }) {
  return predictProbs({
    homeAttack: lambdaHome / 1.4, // Approximate conversion
    homeDefense: 1.0,
    awayAttack: lambdaAway / 1.4,
    awayDefense: 1.0,
    homeAdvantage: 1.0,
    leagueAverage: 1.4,
    maxGoals
  });
}

module.exports = {
  poisson,
  calculateAttackRating,
  calculateDefenseRating,
  calculateHomeAdvantage,
  predictProbs,
  predictProbsStatic
};
