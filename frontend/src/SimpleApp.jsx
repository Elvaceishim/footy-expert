import { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';

function App() {
  const [test, setTest] = useState('Loading...');

  useEffect(() => {
    setTest('App is working!');
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ⚽ Football Match Prediction AI
        </Typography>
        <Typography variant="body1">
          {test}
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
