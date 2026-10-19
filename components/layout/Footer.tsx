import { navLinks, siteConfig } from "@/lib/config";
import Wordmark from "@/components/ui/Wordmark";
import SectionLink from "@/components/ui/SectionLink";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Wordmark size={28} />
          <p className="body-copy">
            Intelligence, reimagined. VYTRON is a fictional brand created as a design and development concept.
          </p>
        </div>

        <nav aria-label="Footer" className="footer-nav">
          <h2 className="footer-h">Explore</h2>
          <ul>
            {navLinks.map((l) => (
              <li key={l.id}>
                <SectionLink to={l.id}>{l.label}</SectionLink>
              </li>
            ))}
            <li>
              <SectionLink to="contact">Contact</SectionLink>
            </li>
          </ul>
        </nav>

        {siteConfig.socials.length > 0 && (
          <div className="footer-nav">
            <h2 className="footer-h">Follow</h2>
            <ul>
              {siteConfig.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="container footer-base">
        <p className="mono">© 2026 VYTRON concept. All rights reserved.</p>
        <SectionLink to="hero" className="mono footer-top">
          Back to top
        </SectionLink>
      </div>
    </footer>
  );
}
