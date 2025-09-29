import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tw.css';
import './index.css';
import AppRouter from './router/AppRouter';   // <<--- así, con './'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
