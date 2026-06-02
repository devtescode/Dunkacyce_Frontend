import { Link } from "@tanstack/react-router";
import { MessageCircle, Instagram, Mail, Phone } from "lucide-react";
export function Footer() {
    const year = new Date().getFullYear();
    return (<footer className="mt-16 border-t bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display text-2xl">D</div>
            <span className="font-display text-3xl tracking-wide">Dunnkayce</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-background/70">
            Hot campus meals delivered straight to your hostel. Order, pay, and we handle the rest.
          </p>
          <div className="mt-4 flex gap-2">
            <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/10 hover:bg-primary transition" aria-label="WhatsApp"><MessageCircle className="h-4 w-4"/></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/10 hover:bg-primary transition" aria-label="Instagram"><Instagram className="h-4 w-4"/></a>
            <a href="mailto:hello@dunnkayce.com" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/10 hover:bg-primary transition" aria-label="Email"><Mail className="h-4 w-4"/></a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-background">Quick links</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li><Link to="/" className="hover:text-primary">Menu</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
            <li><Link to="/orders" className="hover:text-primary">My orders</Link></li>
            <li><Link to="/payments" className="hover:text-primary">Payments</Link></li>
            <li><Link to="/profile" className="hover:text-primary">Profile</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-background">Support</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5"/> 0800 000 0000</li>
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5"/> hello@dunnkayce.com</li>
            <li>
              <a href="https://wa.me/2348000000000?text=Hi%20Dunnkayce" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                <MessageCircle className="h-3.5 w-3.5"/> Chat on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-background/60">
          <p>© {year} Dunnkayce. All rights reserved.</p>
          <p>Made with ❤️ for hungry students.</p>
        </div>
      </div>
    </footer>);
}
