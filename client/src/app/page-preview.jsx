// This is a standalone preview copy — the real page is at src/app/page.jsx
// The structure, data, and styles are identical.
import { useState } from "react";

const ROLES = [
  { icon: "🎬", title: "Filmmaker",       desc: "Directors, DPs & producers"       },
  { icon: "🎭", title: "Actor",           desc: "Talent for any genre or format"   },
  { icon: "✂️", title: "Editor",          desc: "Video, audio & post-production"   },
  { icon: "✍️", title: "Writer",          desc: "Scripts, screenplays & copy"      },
  { icon: "🎵", title: "Musician",        desc: "Composers & sound designers"      },
  { icon: "🎨", title: "Designer",        desc: "Visual & motion graphics"         },
  { icon: "📸", title: "Photographer",    desc: "Stills & BTS coverage"            },
  { icon: "📱", title: "Content Creator", desc: "Digital & social media"           },
];

const PROJECTS = [
  { type: "Short Film",   title: "Neon Requiem",    desc: "A neo-noir thriller set in a rain-soaked city. Seeking raw, atmospheric performances.", roles: ["Actor", "DP", "Sound Designer"],         paid: true,  location: "Los Angeles, CA", color: "#7c3aed" },
  { type: "Music Video",  title: "Echoes in Static", desc: "Experimental visuals for an indie electronic artist. Full creative freedom encouraged.",  roles: ["Director", "Editor", "Choreographer"],   paid: false, location: "New York, NY",   color: "#db2777" },
  { type: "Documentary",  title: "Urban Roots",      desc: "Exploring street art culture across five cities. A story of identity and expression.",     roles: ["Writer", "Photographer", "Editor"],      paid: true,  location: "Remote / Travel", color: "#0891b2" },
];

const STEPS = [
  { num: "01", title: "Post Your Project",     desc: "Describe your vision, set the required roles, timeline, and whether it's paid or a passion collab." },
  { num: "02", title: "Find Collaborators",    desc: "Browse applications from skilled creators. Filter by role, location, and experience level." },
  { num: "03", title: "Create Together",       desc: "Build your team, sync through your project dashboard, and bring your creative vision to life." },
];

const PROBLEMS = [
  { title: "No centralized place",  desc: "Creators waste hours across Instagram DMs, Reddit posts, and Facebook groups trying to find collaborators." },
  { title: "Trust is a gamble",     desc: "Connecting with strangers feels risky. There's no way to vet skills, professionalism, or reliability." },
  { title: "Projects fall apart",   desc: "Without structure or a shared hub, teams lose momentum. Great ideas die because coordination fails." },
];

export default function LandingPreview() {
  const [hoveredRole, setHoveredRole]       = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [mobileOpen, setMobileOpen]         = useState(false);

  const btn = {
    primary: { background: "#f59e0b", color: "#000", fontWeight: 700, padding: "0.75rem 1.75rem", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "0.95rem", textDecoration: "none", display: "inline-block", letterSpacing: "-0.01em" },
    outline: { background: "transparent", color: "#fff", fontWeight: 600, padding: "0.75rem 1.75rem", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "0.95rem", textDecoration: "none", display: "inline-block" },
  };

  const chip = { display: "inline-block", background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.3rem 0.9rem", borderRadius: "100px", marginBottom: "1.25rem", border: "1px solid rgba(245,158,11,0.25)" };
  const h2 = { fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "1rem", color: "#fff" };
  const lead = { fontSize: "1.1rem", color: "#9ca3af", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" };
  const card = { background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "1.75rem" };
  const section = { padding: "6rem 1.5rem" };
  const wide = { maxWidth: "1160px", margin: "0 auto" };
  const center = { textAlign: "center", maxWidth: "720px", margin: "0 auto" };

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: "#080808", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: "62px", background: "rgba(8,8,8,0.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.04em" }}>CREW<span style={{ color: "#f59e0b" }}>UP</span></span>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <span style={{ color: "#9ca3af", fontSize: "0.875rem", cursor: "pointer" }}>Explore</span>
          <span style={{ color: "#9ca3af", fontSize: "0.875rem", cursor: "pointer" }}>Login</span>
          <span style={{ ...btn.primary, padding: "0.5rem 1.1rem", fontSize: "0.85rem" }}>Join Free</span>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", padding: "8rem 1.5rem 7rem", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: "900px", height: "600px", background: "radial-gradient(ellipse,rgba(245,158,11,0.09) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "5%", width: "500px", height: "400px", background: "radial-gradient(ellipse,rgba(124,58,237,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "0%", right: "3%", width: "500px", height: "400px", background: "radial-gradient(ellipse,rgba(219,39,119,0.05) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "920px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", padding: "0.35rem 1rem", fontSize: "0.78rem", color: "#9ca3af", marginBottom: "2.5rem" }}>
            <span style={{ width: "6px", height: "6px", background: "#22c55e", borderRadius: "50%", display: "inline-block" }} />
            Now live — join thousands of creators
          </div>

          <h1 style={{ fontSize: "clamp(2.8rem,7.5vw,5.75rem)", fontWeight: 900, letterSpacing: "-0.055em", lineHeight: 1.0, marginBottom: "1.75rem" }}>
            Find Your Creative Team.
            <br /><span style={{ color: "#f59e0b" }}>Start Your Next Project.</span>
          </h1>
          <p style={{ fontSize: "clamp(1rem,2vw,1.2rem)", color: "#9ca3af", lineHeight: 1.75, maxWidth: "580px", margin: "0 auto 3rem" }}>
            CREWUPFILMS connects filmmakers, actors, editors, writers, and every creative professional into project-based teams. Stop working alone — start creating together.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ ...btn.primary, ...{ padding: "0.85rem 2rem", fontSize: "1rem", borderRadius: "10px" } }}>Join as Creator</span>
            <span style={{ ...btn.outline, ...{ padding: "0.85rem 2rem", fontSize: "1rem", borderRadius: "10px" } }}>Explore Projects</span>
          </div>

          {/* stats */}
          <div style={{ marginTop: "4.5rem", display: "flex", justifyContent: "center", gap: "4rem", flexWrap: "wrap" }}>
            {[["2,400+", "Creators"], ["380+", "Projects Posted"], ["94%", "Team Fill Rate"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.04em" }}>{n}</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.25rem" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: 0 }} />

      {/* PROBLEM */}
      <section style={section}>
        <div style={wide}>
          <div style={{ ...center, marginBottom: "3.5rem" }}>
            <div style={chip}>The Problem</div>
            <h2 style={h2}>Creative potential, lost to logistics</h2>
            <p style={lead}>Talented creators never make their best work alone — but finding the right people has always been frustratingly broken.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.25rem" }}>
            {PROBLEMS.map((p) => (
              <div key={p.title} style={{ ...card }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "11px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: "1rem" }}>✗</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>{p.title}</div>
                <div style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: 0 }} />

      {/* HOW IT WORKS */}
      <section style={{ ...section, background: "#0a0a0a" }}>
        <div style={wide}>
          <div style={{ ...center, marginBottom: "4rem" }}>
            <div style={chip}>How It Works</div>
            <h2 style={h2}>Three steps to your creative team</h2>
            <p style={lead}>Built around projects, not profiles. Start with your vision and we'll connect you with the people who can make it real.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.75rem" }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ ...card, background: "linear-gradient(135deg,#111 0%,#0f0f0f 100%)", position: "relative", overflow: "hidden", padding: "2.25rem" }}>
                <div style={{ position: "absolute", top: "1rem", right: "1.5rem", fontSize: "5rem", fontWeight: 900, color: "rgba(255,255,255,0.025)", lineHeight: 1 }}>{step.num}</div>
                <div style={{ width: "52px", height: "52px", borderRadius: "13px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1.5rem" }}>
                  {i === 0 ? "📋" : i === 1 ? "🔍" : "🎬"}
                </div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#f59e0b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Step {step.num}</div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.7rem", letterSpacing: "-0.02em" }}>{step.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: 0 }} />

      {/* PROJECTS */}
      <section style={section}>
        <div style={wide}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.75rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={chip}>Featured Projects</div>
              <h2 style={{ ...h2, marginBottom: 0 }}>Projects looking for talent</h2>
            </div>
            <span style={{ ...btn.outline, fontSize: "0.85rem", padding: "0.55rem 1.1rem", cursor: "pointer" }}>View All →</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.5rem" }}>
            {PROJECTS.map((p, i) => (
              <div
                key={p.title}
                onMouseEnter={() => setHoveredProject(i)}
                onMouseLeave={() => setHoveredProject(null)}
                style={{
                  ...card,
                  cursor: "pointer",
                  borderColor: hoveredProject === i ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
                  transform: hoveredProject === i ? "translateY(-4px)" : "translateY(0)",
                  transition: "all 0.2s",
                  display: "flex", flexDirection: "column", gap: "1.1rem",
                }}>
                <div style={{ height: "3px", background: p.color, borderRadius: "2px", margin: "-1.75rem -1.75rem 0", borderTopLeftRadius: "15px", borderTopRightRadius: "15px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", background: "rgba(255,255,255,0.05)", padding: "0.25rem 0.6rem", borderRadius: "6px" }}>{p.type}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: p.paid ? "#22c55e" : "#f59e0b", background: p.paid ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", padding: "0.25rem 0.6rem", borderRadius: "6px", border: `1px solid ${p.paid ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}` }}>{p.paid ? "💰 Paid" : "🤝 Collab"}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.45rem", letterSpacing: "-0.02em" }}>{p.title}</h3>
                  <p style={{ color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.65 }}>{p.desc}</p>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "#4b5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Roles Needed</div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {p.roles.map((r) => (
                      <span key={r} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "0.2rem 0.55rem", borderRadius: "6px" }}>{r}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "0.78rem", color: "#4b5563" }}>📍 {p.location}</span>
                  <span style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 700, cursor: "pointer" }}>Apply →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: 0 }} />

      {/* ROLES */}
      <section style={{ ...section, background: "#0a0a0a" }}>
        <div style={wide}>
          <div style={{ ...center, marginBottom: "3.5rem" }}>
            <div style={chip}>For Every Creator</div>
            <h2 style={h2}>Whatever your craft, there's a team for you</h2>
            <p style={lead}>Built for every discipline in the creative industry. Join the role that fits you, find the projects that need you.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: "1rem" }}>
            {ROLES.map((r, i) => (
              <div
                key={r.title}
                onMouseEnter={() => setHoveredRole(i)}
                onMouseLeave={() => setHoveredRole(null)}
                style={{
                  ...card,
                  textAlign: "center", padding: "2rem 1.25rem", cursor: "pointer",
                  borderColor: hoveredRole === i ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.07)",
                  background: hoveredRole === i ? "rgba(245,158,11,0.04)" : "#111",
                  transform: hoveredRole === i ? "translateY(-5px)" : "translateY(0)",
                  transition: "all 0.2s",
                }}>
                <div style={{ fontSize: "2.25rem", marginBottom: "0.75rem" }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.3rem" }}>{r.title}</div>
                <div style={{ color: "#6b7280", fontSize: "0.78rem", lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: 0 }} />

      {/* CTA BANNER */}
      <section style={{ padding: "8rem 1.5rem", background: "linear-gradient(135deg,#0f0900 0%,#080808 40%,#0a0014 100%)", position: "relative", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "450px", background: "radial-gradient(ellipse,rgba(245,158,11,0.1) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "660px", margin: "0 auto" }}>
          <div style={chip}>Ready to Create?</div>
          <h2 style={{ fontSize: "clamp(2.2rem,5vw,3.75rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.1, marginBottom: "1.5rem" }}>
            Your next great project<br /><span style={{ color: "#f59e0b" }}>starts with the right team.</span>
          </h2>
          <p style={{ ...lead, margin: "0 auto 2.75rem" }}>Join thousands of creators who stopped working alone and started building the projects they always imagined.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ ...btn.primary, padding: "0.9rem 2.2rem", fontSize: "1rem", borderRadius: "10px", cursor: "pointer" }}>Start for Free</span>
            <span style={{ ...btn.outline, padding: "0.9rem 2.2rem", fontSize: "1rem", borderRadius: "10px", cursor: "pointer" }}>Browse Projects</span>
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "#374151" }}>No credit card required · Free to join · Start posting projects today</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2.5rem 2rem", background: "#080808" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.04em" }}>CREW<span style={{ color: "#f59e0b" }}>UP</span></span>
          <div style={{ display: "flex", gap: "1.75rem", flexWrap: "wrap" }}>
            {["Explore", "For Creators", "About", "Privacy", "Terms"].map((l) => (
              <span key={l} style={{ color: "#4b5563", fontSize: "0.8rem", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#374151" }}>© {new Date().getFullYear()} CREWUPFILMS. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
