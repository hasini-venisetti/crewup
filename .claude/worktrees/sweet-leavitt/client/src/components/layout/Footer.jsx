import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-white font-bold text-base tracking-tight">
              CREWUP<span style={{ color: '#6055de' }}>FILMS</span>
            </span>
            <p className="text-sm text-white/40 mt-3 leading-relaxed">
              Where creators find their team.<br />Build something worth watching.
            </p>
            <p className="text-xs text-white/25 mt-3">hello@crewup.in</p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-white/25 uppercase tracking-[0.15em] mb-5">Product</p>
            <ul className="space-y-3">
              <li><Link href="/projects"       className="text-sm text-white/45 hover:text-white transition-colors">Explore Projects</Link></li>
              <li><Link href="/explore"        className="text-sm text-white/45 hover:text-white transition-colors">Find Creators</Link></li>
              <li><Link href="/create-project" className="text-sm text-white/45 hover:text-white transition-colors">Create Project</Link></li>
              <li><Link href="/how-it-works"   className="text-sm text-white/45 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/features"       className="text-sm text-white/45 hover:text-white transition-colors">Features</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-white/25 uppercase tracking-[0.15em] mb-5">Company</p>
            <ul className="space-y-3">
              <li><Link href="/about"   className="text-sm text-white/45 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/mission" className="text-sm text-white/45 hover:text-white transition-colors">Our Mission</Link></li>
              <li><Link href="/blog"    className="text-sm text-white/45 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-sm text-white/45 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs font-semibold text-white/25 uppercase tracking-[0.15em] mb-5">Community</p>
            <ul className="space-y-3">
              <li><Link href="/contests"    className="text-sm text-white/45 hover:text-white transition-colors">Contests</Link></li>
              <li><Link href="/leaderboard" className="text-sm text-white/45 hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link href="/films"       className="text-sm text-white/45 hover:text-white transition-colors">Films</Link></li>
              <li><Link href="/crew-match"  className="text-sm text-white/45 hover:text-white transition-colors">Crew Match</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-white/25 uppercase tracking-[0.15em] mb-5">Legal</p>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-white/45 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms"   className="text-sm text-white/45 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} CREWUPFILMS. All rights reserved.</p>
          <p className="text-xs text-white/20">Made with ♥ for independent creators</p>
        </div>

        {/* Large wordmark — bottom */}
        <div className="overflow-hidden -mx-6">
          <p
            className="font-black uppercase leading-none select-none text-white/10 text-center"
            style={{
              fontSize: 'clamp(4rem, 13vw, 11rem)',
              letterSpacing: '-0.03em',
            }}
          >
            CREWUPFILMS
          </p>
        </div>

      </div>
    </footer>
  );
}
