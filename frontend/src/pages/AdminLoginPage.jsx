import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import kahootAPI from '../services/api';

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await kahootAPI.adminLogin(credentials.username, credentials.password);
      const token = response.data.token;
      
      // Store token in localStorage
      localStorage.setItem('adminToken', token);
      
      // Navigate to admin panel
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header>
        <h1>🔐 Admin Login</h1>
        <p>Administratorlik panelga kirish</p>
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
