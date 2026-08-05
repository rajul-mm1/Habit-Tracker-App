import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🔥 Habit Partners</Link>
      <div className="navbar-actions">
        {token ? (
          <>
            <span className="muted">{userName}</span>
            <button className="secondary" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login"><button className="secondary">Log in</button></Link>
            <Link to="/signup"><button>Sign up</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
