import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import MoviesPage from './pages/MoviesPage.jsx';
import RewatchPlanPage from './pages/RewatchPlanPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MoviesPage />} />
            <Route path="/rewatch" element={<RewatchPlanPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
