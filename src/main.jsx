import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { hydrateSite } from './admin/store'

// Load the admin's saved catalogue (if any) into the shop before the first render.
// (database mode: a newer catalogue arriving after first paint triggers a re-render via this event)
hydrateSite(() => window.dispatchEvent(new Event('kridhya:catalogue'))).finally(() =>
  ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  ),
)
