import Link from 'next/link';

const footerLink = "text-sm text-white/50 hover:text-[#8b82ff] transition-colors";

export default function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        background: 'linear-gradient(180deg, #100e1f 0%, #0b0a16 100%)',
        borderTop: '2px solid rgba(96,85,222,0.45)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-white font-bold text-base tracking-tight">
              CREWUP<span style={{ color: '#8b82ff' }}>FILMS</span>
            </span>
            <p className="text-sm text-white/45 mt-3 leading-relaxed">
              Where creators find their team.<br />Build something worth watching.
            </p>
            <p className="text-xs text-white/25 mt-3">crewupfilms@gmail.com</p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: '#6055de' }}>Product</p>
            <ul className="space-y-3">
              <li><Link href="/projects"       className={footerLink}>Explore Projects</Link></li>
              <li><Link href="/explore"        className={footerLink}>Find Creators</Link></li>
              <li><Link href="/create-project" className={footerLink}>Create Project</Link></li>
              <li><Link href="/how-it-works"   className={footerLink}>How It Works</Link></li>
              <li><Link href="/features"       className={footerLink}>Features</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: '#6055de' }}>Company</p>
            <ul className="space-y-3">
              <li><Link href="/about"   className={footerLink}>About Us</Link></li>
              <li><Link href="/mission" className={footerLink}>Our Mission</Link></li>
              <li><Link href="/blog"    className={footerLink}>Blog</Link></li>
              <li><Link href="/contact" className={footerLink}>Contact</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: '#6055de' }}>Community</p>
            <ul className="space-y-3">
              <li><Link href="/contests"    className={footerLink}>Contests</Link></li>
              <li><Link href="/leaderboard" className={footerLink}>Leaderboard</Link></li>
              <li><Link href="/films"       className={footerLink}>Films</Link></li>
              <li><Link href="/crew-match"  className={footerLink}>Crew Match</Link></li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: '#6055de' }}>Trust &amp; Safety</p>
            <ul className="space-y-3">
              <li><Link href="/safety"                     className={footerLink}>🛡 Safety Guide</Link></li>
              <li><Link href="/report"                     className={footerLink}>Report an Issue</Link></li>
              <li><Link href="/support"                    className={footerLink}>Support</Link></li>
              <li><Link href="/legal/privacy"              className={footerLink}>Privacy Policy</Link></li>
              <li><Link href="/legal/terms"                className={footerLink}>Terms of Service</Link></li>
              <li><Link href="/legal/community-guidelines" className={footerLink}>Community Guidelines</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10"
          style={{ borderTop: '1px solid rgba(96,85,222,0.15)' }}
        >
          <p className="text-xs text-white/25">© {new Date().getFullYear()} CREWUPFILMS. All rights reserved.</p>
          <p className="text-xs" style={{ color: 'rgba(139,130,255,0.4)' }}>Made with ♥ for independent creators</p>
        </div>

        {/* Large wordmark — bottom */}
        <div className="overflow-hidden -mx-6">
          <p
            className="font-black uppercase leading-none select-none text-center"
            style={{
              fontSize: 'clamp(4rem, 13vw, 11rem)',
              letterSpacing: '-0.03em',
              color: 'rgba(96,85,222,0.07)',
            }}
          >
            CREWUPFILMS
          </p>
        </div>

      </div>
    </footer>
  );
}
