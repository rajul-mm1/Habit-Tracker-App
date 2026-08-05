import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import HowItWorks from '../components/HowItWorks';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="form-wrapper card fade-in-up">
        <h1>Welcome back</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <p className="error-text">{error}</p>}

          <div style={{ marginTop: 20 }}>
            <button type="submit" disabled={loading} className="checkin-btn" style={{ width: '100%' }}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

      <HowItWorks />
    </div>
  );
}

export default Login;
