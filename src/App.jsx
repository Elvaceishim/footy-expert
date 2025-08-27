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
  
  // Debug environment loading
  console.log('🔑 API Key Loading Debug:');
  console.log('- Raw viteKey exists:', !!viteKey);
  console.log('- Raw viteKey length:', viteKey?.length);
  console.log('- Raw viteKey preview:', viteKey?.substring(0, 15) + '...');
  
  if (viteKey && viteKey.length > 10 && viteKey.startsWith('sk-or-v1-')) {
    console.log('✅ Using Vite environment variable');
    return viteKey;
  }
  
  // Method 2: Check for any environment variables that might contain the key
  const allEnvKeys = Object.keys(import.meta.env);
  console.log('🔍 All environment keys:', allEnvKeys);
  
  const potentialKeys = allEnvKeys.filter(key => 
    key.includes('OPENROUTER') || key.includes('API_KEY')
  );
  
  console.log('🔍 Potential API key variables:', potentialKeys);
  
  for (const key of potentialKeys) {
    const value = import.meta.env[key];
    console.log(`🔍 Checking ${key}:`, value?.substring(0, 15) + '...');
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

// ... rest of the App component (truncated for space but would include the full component)

export default App;
