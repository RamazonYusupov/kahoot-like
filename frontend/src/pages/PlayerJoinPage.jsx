import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import kahootAPI from '../services/api';

export default function PlayerJoinPage() {
  const [playerForm, setPlayerForm] = useState({ roomCode: '', playerName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const joiningInFlightRef = useRef(false);
  const navigate = useNavigate();

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    if (joiningInFlightRef.current || loading) {
      return;
    }

    if (!playerForm.roomCode.trim() || !playerForm.playerName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    joiningInFlightRef.current = true;
    setLoading(true);
    setError('');
    try {
      const roomCode = playerForm.roomCode.toUpperCase();
      const response = await kahootAPI.joinRoom(roomCode, playerForm.playerName);
      const playerId = response.data.player_id;

      // Use sessionStorage so each tab keeps its own player identity.
      sessionStorage.setItem(`player_${roomCode}`, playerId);
      sessionStorage.setItem(`playerName_${roomCode}`, playerForm.playerName);

      const playerUrl = `/play/${roomCode}`;
      navigate(playerUrl);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join room');
    } finally {
      joiningInFlightRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header>
        <h1>👤 Player UI</h1>
        <p>Room code orqali o‘yinga qo‘shiling</p>
      </header>

      <div className="container">
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handlePlayerSubmit}>
            <h2>Join Room</h2>
            <div className="form-group">
              <label>Room Code</label>
              <input
                type="text"
                value={playerForm.roomCode}
                onChange={(e) => setPlayerForm({ ...playerForm, roomCode: e.target.value.toUpperCase() })}
                placeholder="e.g., XKQPLM"
                maxLength="6"
                style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
              />
            </div>

            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={playerForm.playerName}
                onChange={(e) => setPlayerForm({ ...playerForm, playerName: e.target.value })}
                placeholder="e.g., Alice"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
