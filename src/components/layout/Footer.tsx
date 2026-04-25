import Link from 'next/link'

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ marginBottom: '14px' }}>
              {/* mix-blend-mode:multiply removes black background on white footer */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-petpals-black.png"
                alt="PetPals"
                style={{ height: '44px', width: 'auto', mixBlendMode: 'multiply' }}
              />
            </div>
            <p>PetPals is a pet adoption platform designed to help people find and adopt pets in need of loving homes. Through an easy and safe process, PetPals connects animals with caring adopters and supports responsible pet adoption.</p>
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <ul>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/contact">Contacs</Link></li>
              <li><Link href="/pets">Search</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect to Us</h4>
            <div className="footer-social" style={{ marginTop: '4px', display: 'flex', gap: '10px' }}>
              {/* Instagram */}
              <a href="#" title="Instagram" aria-label="Instagram" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: '#fff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="#" title="Facebook" aria-label="Facebook" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: '#1877f2', color: '#fff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="#" title="X / Twitter" aria-label="X" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: '#000', color: '#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Petpals. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
