import './FeaturesSection.css';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
    title: 'Pomodoro Timer',
    description: 'Timer fokus yang presisi, dengan alarm, riwayat sesi, dan statistik mingguan yang auto-tersimpan.',
    color: 'blue'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
      </svg>
    ),
    title: 'Habit & Goal Tracking',
    description: 'Bangun kebiasaan harian dengan streak tracker. Catat goals dan pantau progressnya setiap hari.',
    color: 'purple'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    title: 'Jurnal & Jadwal Kuliah',
    description: 'Tulis refleksi harian dengan mood tracker, dan simpan jadwal kuliah lengkap dengan ruangan dan kode dosen.',
    color: 'indigo'
  }
];

export default function FeaturesSection() {
  return (
    <section className="features-section container section" id="features">
      <div className="features-header">
        <p className="features-subtitle">Why StudySpace</p>
        <h2 className="features-title">Everything you need to actually start.</h2>
      </div>
      
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card glass-card">
            <div className={`feature-icon-wrapper color-${feature.color}`}>
              {feature.icon}
            </div>
            <h3 className="feature-card-title">{feature.title}</h3>
            <p className="feature-card-desc">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
