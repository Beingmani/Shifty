import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/outfit';
import '../styles/tokens.css';
import '../styles/variables.css';
import '../styles/global.css';
import './settings.css';
import { initTheme } from '../shared/theme.js';
import App from './App.jsx';

initTheme();
createRoot(document.getElementById('root')).render(<App />);
