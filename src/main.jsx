import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './styling/index.css';
import './styling/style.css';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
    <App/>
  </BrowserRouter>,
);
