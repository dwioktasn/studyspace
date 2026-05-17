import Image from 'next/image';
import Link from 'next/link';
import './HeroSection.css';

export default function HeroSection() {
  return (
    <section className="hero-section container">
      <div className="hero-content">
        <div className="status-pill animate-fade-in">
          <span className="status-dot"></span>
          2,481 students focusing right now
        </div>
        
        <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Study<br/>
          Together.<br/>
          <span className="text-gradient">Focus Better.</span>
        </h1>
        
        <p className="hero-description animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Cozy virtual rooms, gentle Pomodoros, ambient sounds and a community that shows up every day. The aesthetic study space your brain has been waiting for.
        </p>
        
        <div className="hero-actions animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link href="/signup" className="btn btn-primary btn-large">
            Start focusing free <span>→</span>
          </Link>
          <button className="btn btn-secondary btn-large btn-tour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            Tour a study room
          </button>
        </div>
        
        <div className="social-proof animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="avatar-group">
            <div className="avatar avatar-1"></div>
            <div className="avatar avatar-2"></div>
            <div className="avatar avatar-3"></div>
          </div>
          <span className="social-text">Joined by 60,000+ students worldwide</span>
        </div>
      </div>
      
      <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="visual-container glow-wrapper animate-float">
          <div className="floating-badge badge-pomodoro">
            <div className="badge-icon">⏱</div>
            <div className="badge-text">
              <span className="badge-label">Pomodoro</span>
              <span className="badge-value">24:18 focused</span>
            </div>
          </div>
          
          <div className="floating-badge badge-streak">
            <div className="badge-icon streak-icon">🏆</div>
            <div className="badge-text">
              <span className="badge-label">Streak</span>
              <span className="badge-value">14 days 🔥</span>
            </div>
          </div>
          
          <div className="image-wrapper">
            {/* We use a generated image here as requested */}
            <img src="/hero.png" alt="Study illustration" className="hero-img" />
          </div>
        </div>
      </div>
    </section>
  );
}
