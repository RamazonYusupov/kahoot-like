import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import kahootAPI from '../services/api';

export default function AdminPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hostForm, setHostForm] = useState({ topic: '', hostId: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    // Check if user is authenticated
    if (!token) {
      navigate('/admin-login');
      return;
    }
  }, [token, navigate]);

  const loadRooms = async () => {
    try {
      if (!token) {
        setError('Token not found. Please login again.');
        setLoading(false);
        return;
      }
      
      const response = await kahootAPI.getAdminRooms(token);
      const rows = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.value)
          ? response.data.value
          : [];

      const normalized = rows.map((room) => {
        const names = Array.isArray(room.player_names)
          ? room.player_names
          : Array.isArray(room.players)
            ? room.players
                .map((p) => (typeof p === 'string' && p.includes(':') ? p.split(':').slice(1).join(':') : p))
                .filter(Boolean)
            : [];

        return {
          ...room,
          player_names: names,
        };
      });

      setRooms(normalized);
      setError('');
    } catch (err) {
      console.error('Load rooms error:', err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('adminToken');
        navigate('/admin-login');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to load rooms');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadRooms();
      const interval = setInterval(loadRooms, 4000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!hostForm.topic.trim() || !hostForm.hostId.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await kahootAPI.createRoom(hostForm.topic, hostForm.hostId);
      const roomCode = response.data.code;
      localStorage.setItem(`host_${roomCode}`, hostForm.hostId);
      setHostForm({ topic: '', hostId: '' });
      await loadRooms();
      navigate(`/host/${roomCode}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create room');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (code) => {
    if (!window.confirm(`Delete room ${code} and all its data?`)) {
      return;
    }

    try {
      await kahootAPI.deleteAdminRoom(code, token);
      setRooms((prev) => prev.filter((r) => r.code !== code));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin-login');
      } else {
        setError(err.response?.data?.detail || 'Failed to delete room');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await kahootAPI.adminLogout(token);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('adminToken');
      navigate('/');
    }
  };

  return (
    <div className="page">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🛠️ Admin Panel</h1>
            <p>Roomlar va savollarni boshqarish uchun alohida admin interfeys</p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
            style={{ height: 'fit-content' }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid grid-2">
          <div className="card">
            <h2>Yangi Room Yaratish</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label>Admin/Host ID</label>
                <input
                  type="text"
                  value={hostForm.hostId}
                  onChange={(e) => setHostForm({ ...hostForm, hostId: e.target.value })}
                  placeholder="e.g., admin@kahoot.uz"
                />
              </div>

              <div className="form-group">
                <label>Topic</label>
                <input
                  type="text"
                  value={hostForm.topic}
                  onChange={(e) => setHostForm({ ...hostForm, topic: e.target.value })}
                  placeholder="e.g., JavaScript Basics"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Yaratilmoqda...' : 'Room yaratish'}
              </button>
            </form>
          </div>

        </div>

        <div className="card">
          <h2>Mavjud Roomlar</h2>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="alert alert-info">Hozircha room yo'q.</div>
          ) : (
            <table className="leaderboard">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Players</th>
                  <th>Player List</th>
                  <th>Questions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.code}>
                    <td><strong>{room.code}</strong></td>
                    <td>{room.topic}</td>
                    <td>{room.status}</td>
                    <td>{room.player_count}</td>
                    <td>
                      {room.player_names && room.player_names.length > 0
                        ? room.player_names.join(', ')
                        : '-'}
                    </td>
                    <td>{room.question_count}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-small btn-primary" onClick={() => navigate(`/host/${room.code}`)}>
                          Manage
                        </button>
                        <button className="btn btn-small btn-danger" onClick={() => handleDeleteRoom(room.code)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
