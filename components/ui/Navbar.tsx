import Link from 'next/link';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar container">
      <div className="navbar-logo">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="white" />
            <path d="M5 4L5.5 5.5L7 6L5.5 6.5L5 8L4.5 6.5L3 6L4.5 5.5L5 4Z" fill="white" />
            <path d="M19 18L19.5 19.5L21 20L19.5 20.5L19 22L18.5 20.5L17 20L18.5 19.5L19 18Z" fill="white" />
          </svg>
        </div>
        <span className="logo-text">StudySpace</span>
      </div>
      
      <div className="navbar-links">
        <Link href="#features">Features</Link>
        <Link href="#rooms">Rooms</Link>
        <Link href="#loved-by">Loved by</Link>
      </div>
      
      <div className="navbar-actions">
        <Link href="/login" className="login-link">Sign in</Link>
        <Link href="/app" className="btn btn-primary">
          Open app <span>→</span>
        </Link>
      </div>
    </nav>
  );
}
