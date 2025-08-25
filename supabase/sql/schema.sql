-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(500),
    founded INTEGER,
    country VARCHAR(100)
);

-- Create fixtures table
CREATE TABLE IF NOT EXISTS fixtures (
    id INTEGER PRIMARY KEY,
    date TIMESTAMP,
    status VARCHAR(20),
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_goals INTEGER,
    away_goals INTEGER,
    league_id INTEGER,
    season INTEGER
);

-- Create results table
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id),
    home_goals INTEGER,
    away_goals INTEGER,
    result VARCHAR(1) -- 'H', 'D', 'A'
);

-- Create team_ratings table
CREATE TABLE IF NOT EXISTS team_ratings (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    rating DECIMAL(5,2),
    date DATE
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    fixture_id INTEGER REFERENCES fixtures(id),
    model_version VARCHAR(50),
    p_home DECIMAL(5,4),
    p_draw DECIMAL(5,4),
    p_away DECIMAL(5,4),
    PRIMARY KEY (fixture_id, model_version)
);