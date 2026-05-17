import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/ui/HeroSection';
import FeaturesSection from '@/components/ui/FeaturesSection';
import StudyRoomPreview from '@/components/ui/StudyRoomPreview';
import TestimonialsSection from '@/components/ui/TestimonialsSection';
import BottomCTASection from '@/components/ui/BottomCTASection';
import Footer from '@/components/ui/Footer';

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StudyRoomPreview />
      <TestimonialsSection />
      <BottomCTASection />
      <Footer />
    </div>
  );
}
