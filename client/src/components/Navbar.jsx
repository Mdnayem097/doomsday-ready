import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-text">Doomsday Ready</span>
        </NavLink>
        <nav className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Movies
          </NavLink>
          <NavLink
            to="/rewatch"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Rewatch Plan
          </NavLink>
          <NavLink
            to="/booking"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Cinema Booking
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
