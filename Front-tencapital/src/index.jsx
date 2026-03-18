import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* 
      Using BrowserRouter for clean URLs (requires server configuration)
      If your server doesn't support client-side routing, switch to HashRouter:
      
      import { HashRouter } from 'react-router-dom';
      <HashRouter>
        <App />
      </HashRouter>
      
      HashRouter uses URLs like: http://localhost:3000/#/about
      BrowserRouter uses URLs like: http://localhost:3000/about
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
