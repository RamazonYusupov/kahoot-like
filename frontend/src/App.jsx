import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import PlayerJoinPage from './pages/PlayerJoinPage';
import HostPanel from './pages/HostPanel';
import HostGamePage from './pages/HostGamePage';
import PlayerGamePage from './pages/PlayerGamePage';
import './styles/global.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/player" element={<PlayerJoinPage />} />
        <Route path="/host/:code" element={<HostPanel />} />
        <Route path="/host/game/:code" element={<HostGamePage />} />
        <Route path="/play/:code" element={<PlayerGamePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
