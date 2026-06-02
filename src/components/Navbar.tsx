import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, ShoppingCart, Package, CreditCard, User, KeyRound, MessageCircle, LogOut, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { store, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/change-password", label: "Password", icon: KeyRound },
];

export function Navbar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0));
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (pathname === "/login") return null;
  if (!user) return null;

  const handleLogout = () => {
    store.logout();
    navigate({ to: "/login" });
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/2348000000000?text=Hi%20Dunnkayce%20support", "_blank");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display text-xl">D</div>
          <span className="font-display text-2xl tracking-wide">Dunnkayce</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to;
            return (
              <Link key={it.to} to={it.to} className={cn(
                "relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <Icon className="h-4 w-4" />
                {it.label}
                {it.to === "/cart" && cartCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          })}
          <button onClick={openWhatsApp} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
            <MessageCircle className="h-4 w-4" /> Support
          </button>
          {user.role === "admin" && (
            <Link to="/admin" className={cn("flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold", pathname.startsWith("/admin") ? "bg-primary text-primary-foreground" : "bg-foreground text-background hover:opacity-90")}>
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive hover:text-destructive-foreground">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </nav>

        <button className="lg:hidden rounded-md p-2 hover:bg-secondary" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t bg-background">
          <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-2 gap-2">
            {navItems.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.to;
              return (
                <Link key={it.to} to={it.to} onClick={() => setOpen(false)} className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
                )}>
                  <Icon className="h-4 w-4" /> {it.label}
                  {it.to === "/cart" && cartCount > 0 && <span className="ml-auto rounded-full bg-primary px-2 text-xs text-primary-foreground">{cartCount}</span>}
                </Link>
              );
            })}
            <button onClick={() => { openWhatsApp(); setOpen(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
              <MessageCircle className="h-4 w-4" /> Support
            </button>
            {user.role === "admin" && (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-foreground text-background">
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
            <button onClick={handleLogout} className="col-span-2 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm bg-destructive text-destructive-foreground">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
