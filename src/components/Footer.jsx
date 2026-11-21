import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-primary/10 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-black text-lg">
              D
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">DUNNKAYCE</p>
              <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Swift Campus Feast</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/80">
            Fresh, tasty campus meals made easy. Order your favourites, pay securely, and get them delivered fast around campus.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-accent hover:text-accent-foreground"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-accent hover:text-accent-foreground"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@dunnkayce.com"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-accent hover:text-accent-foreground"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Quick links</h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li><Link to="/" hash="menu" className="transition hover:text-accent">Menu</Link></li>
            <li><Link to="/" hash="how-it-works" className="transition hover:text-accent">How It Works</Link></li>
            <li><Link to="/orders" className="transition hover:text-accent">My Orders</Link></li>
            <li><Link to="/cart" className="transition hover:text-accent">Cart</Link></li>
            <li><Link to="/profile" className="transition hover:text-accent">Profile</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Support</h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> <a href="tel:+2348000000000" className="hover:text-accent">0800 000 0000</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> <a href="mailto:hello@dunnkayce.com" className="hover:text-accent">hello@dunnkayce.com</a></li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Elizade University Campus</li>
          </ul>
        </div>
      </div>

      {/* <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/65 sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} DUNNKAYCE. All rights reserved.</p>
          <p>Fresh. Tasty. Delivered.</p>
        </div>
      </div> */}
    </footer>
  );
}