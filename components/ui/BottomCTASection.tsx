import Link from 'next/link';
import './BottomCTASection.css';

export default function BottomCTASection() {
  return (
    <section className="cta-section container section">
      <div className="cta-card glow-wrapper">
        <div className="cta-content">
          <h2 className="cta-title">
            Your next focus session<br/>starts in 30 seconds.
          </h2>
          <p className="cta-subtitle">Free forever. Cozy by design.</p>
          <Link href="/app" className="btn btn-primary btn-large">
            Open StudySpace <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
