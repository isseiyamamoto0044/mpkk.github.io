// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const qc = new QueryClient();

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  // <React.StrictMode> を付けてもOK（二重実行に見えるのが嫌なら外してOK）
  // <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  // </React.StrictMode>
);
