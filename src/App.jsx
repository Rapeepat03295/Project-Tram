import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home'
import Event from './pages/Event';
import Feedback from './pages/Feedback';
import RoutesPath from './pages/Routes';
import { GoogleMapsProvider } from '../src/context/GoogleMapContext';
import './App.css';

function App() {
  return (
    <GoogleMapsProvider>
      <div className="app-main">
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />  
            <Route path="/admin-event" element={<Event />} />
            <Route path="/admin-feedback" element={<Feedback />} />
            <Route path="/admin-route" element={<RoutesPath />} />
          </Routes>
        </Router>
      </div >
    </GoogleMapsProvider>
  );

}

export default App;