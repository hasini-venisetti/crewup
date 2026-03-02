import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer className="bg-[#0e0e0d] border-t-2 border-amber-500/30 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" light noLink />
            <p className="text-sm text-white/50 mt-4 leading-relaxed">
              Where creators find their team.<br />Build something worth watching.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.15em] mb-5">Product</p>
            <ul className="space-y-3">
              <li><Link href="/projects"      className="text-sm text-white/50 hover:text-white transition-colors">Browse Projects</Link></li>
              <li><Link href="/explore"       className="text-sm text-white/50 hover:text-white transition-colors">Explore Creators</Link></li>
              <li><Link href="/leaderboard"   className="text-sm text-white/50 hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link href="/create-project" className="text-sm text-white/50 hover:text-white transition-colors">Post a Project</Link></li>
            </ul>
          </div>

          {/* For Creators */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.15em] mb-5">For Creators</p>
            <ul className="space-y-3">
              <li><Link href="/tags/short-film"   className="text-sm text-white/50 hover:text-white transition-colors">Film</Link></li>
              <li><Link href="/tags/music"        className="text-sm text-white/50 hover:text-white transition-colors">Music</Link></li>
              <li><Link href="/tags/photography"  className="text-sm text-white/50 hover:text-white transition-colors">Photography</Link></li>
              <li><Link href="/tags/podcast"      className="text-sm text-white/50 hover:text-white transition-colors">Podcast</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.15em] mb-5">Account</p>
            <ul className="space-y-3">
              <li><Link href="/signup"    className="text-sm text-white/50 hover:text-white transition-colors">Join Free</Link></li>
              <li><Link href="/login"     className="text-sm text-white/50 hover:text-white transition-colors">Log In</Link></li>
              <li><Link href="/settings"  className="text-sm text-white/50 hover:text-white transition-colors">Settings</Link></li>
              <li><Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">© {new Date().getFullYear()} CREWUPFILMS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/legal/terms"   className="text-xs text-white/30 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/support"       className="text-xs text-white/30 hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
