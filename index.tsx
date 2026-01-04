
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');
if (container) {
  // Robustly extract createRoot from the imported module
  const client = ReactDOMClient as any;
  const createRoot = client.createRoot || (client.default && client.default.createRoot);
  
  if (typeof createRoot === 'function') {
    const root = createRoot(container);
    root.render(<App />);
  } else {
    console.error('Failed to find createRoot in react-dom/client');
  }
}
