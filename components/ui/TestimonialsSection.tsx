import './TestimonialsSection.css';

const testimonials = [
  {
    quote: "Streak habit-ku udah 21 hari. Belum pernah se-konsisten ini sebelumnya — dashboard-nya bikin nagih.",
    author: "Arum",
    role: "Mahasiswa IF",
    avatarColor: "bg-gradient-purple"
  },
  {
    quote: "Pomodoro timer-nya beda dari yang lain. Alarm-nya ada, timer-nya presisi, sesinya otomatis tersimpan.",
    author: "Fariz",
    role: "CS major",
    avatarColor: "bg-gradient-blue"
  },
  {
    quote: "Jadwal kuliah + jurnal harian dalam satu app. Akhirnya nggak perlu buka 3 tab berbeda lagi.",
    author: "Nisa",
    role: "Mahasiswa Teknik",
    avatarColor: "bg-gradient-pink"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="testimonials-section container section" id="loved-by">
      <h2 className="testimonials-title">
        Loved by people who used to <span className="text-gradient">procrastinate.</span>
      </h2>
      
      <div className="testimonials-grid">
        {testimonials.map((t, index) => (
          <div key={index} className="testimonial-card glass-card">
            <div className="quote-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.036c0 1.08.936 1.964 2 1.964z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 1 1 2 1z"></path>
              </svg>
            </div>
            
            <p className="testimonial-quote">"{t.quote}"</p>
            
            <div className="testimonial-author">
              <div className={`testimonial-avatar ${t.avatarColor}`}></div>
              <div className="author-info">
                <span className="author-name">{t.author}</span>
                <span className="author-role">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
