import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatBot from '@/components/ui/ChatBot';
import ScrollToTop from '@/components/ui/ScrollToTop';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatBot />
      <ScrollToTop />
    </div>
  );
}
