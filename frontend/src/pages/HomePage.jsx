import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="hero">
        <h1>🎮 Kahoot Quiz Platform</h1>
        <p>Admin va Player interfeyslari alohida</p>
      </div>

      <div className="container">
        <div className="grid grid-2">
          <div className="card">
            <h2>🛠️ Admin Panel</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Roomlar va savollarni boshqarish, o'yinni start qilish.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/admin-login')}>
              Admin panelga kirish
            </button>
          </div>

          <div className="card">
            <h2>👤 Player UI</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Room code orqali o'yinga qo'shilish va savollarga javob berish.
            </p>
            <button className="btn btn-success" onClick={() => window.open('/player', '_blank')}>
              Player sahifasiga o'tish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
