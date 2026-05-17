import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '40px 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="white" />
            </svg>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            StudySpace · made with <span style={{ color: '#a78bfa' }}>♡</span> for focus
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Terms</Link>
          <Link href="/twitter" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Twitter</Link>
        </div>
      </div>
    </footer>
  );
}
