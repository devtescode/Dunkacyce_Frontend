import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  ShoppingCart,
  Sun,
  User,
  X,
  KeyRound,
  Package,
  CreditCard,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { store, useStore } from "@/lib/store";
import { clearSession } from "@/lib/session";
import { useCurrentUserCartQuery } from "@/lib/api";
import { disconnectUserSocket } from "@/lib/socket";
import { useTheme } from "@/lib/theme";

const publicLinks = [
  { label: "Menu", to: "/", hash: "menu" },
  { label: "How It Works", to: "/", hash: "how-it-works" },
];

export function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { resolvedTheme, toggleTheme } = useTheme();

  const user = useStore((s) => {
    const id = s.currentUserId;
    return id ? s.users.find((u) => u.id === id) ?? null : null;
  });
  const { data: cartItems } = useCurrentUserCartQuery();
  const cartCount = (cartItems ?? []).reduce((n, item) => n + (item.quantity ?? 0), 0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const profileRef = useRef(null);

  const profilePicture =
    typeof user?.profilePicture === "string" && user.profilePicture.trim()
      ? user.profilePicture.trim()
      : "";

  useEffect(() => {
    setAvatarError(false);
  }, [profilePicture]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const isAdminPath = pathname?.startsWith("/admin");
  if (isAdminPath) return null;

  const goToHash = (hash) => {
    setMobileOpen(false);
    if (pathname !== "/") {
      navigate({ to: "/", hash });
      return;
    }
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogout = () => {
    disconnectUserSocket();
    store.logout();
    clearSession();
    queryClient.clear();
    setMobileOpen(false);
    setProfileOpen(false);
    toast.success("Logged out successfully");
    navigate({ to: "/login" });
  };

  const navActive = (to, hash) => {
    if (hash) return pathname === "/" && typeof window !== "undefined" && window.location.hash === `#${hash}`;
    return pathname === to;
  };

  const initials = (user?.fullName || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={user ? "/user-dashboard" : "/"} className="flex items-center gap-3" aria-label={user ? "DUNNKAYCE dashboard" : "DUNNKAYCE home"}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="text-lg font-black tracking-tight">D</span>
            </div>
            <div className="leading-none">
              <div className="text-xl font-black tracking-tight text-primary">DUNNKAYCE</div>
              <div className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Swift Campus Feast
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {!user &&
              publicLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => goToHash(item.hash)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    navActive(item.to, item.hash)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-secondary hover:text-primary",
                  )}
                >
                  {item.label}
                </button>
              ))}
            <Link
              to={user ? "/orders" : "/login"}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                pathname === "/orders"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-secondary hover:text-primary",
              )}
            >
              My Orders
            </Link>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-secondary"
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <Link
              to={user ? "/cart" : "/login"}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-secondary"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 transition hover:bg-secondary"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  {profilePicture && !avatarError ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials || <User className="h-4 w-4" />}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate text-sm font-semibold">{user.fullName?.split(" ")[0] || "Account"}</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", profileOpen && "rotate-180")} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl" role="menu">
                    <Link to="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary" role="menuitem">
                      <User className="h-4 w-4 text-primary" /> Profile
                    </Link>
                    <Link to="/orders" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary" role="menuitem">
                      <Package className="h-4 w-4 text-primary" /> My Orders
                    </Link>
                    <Link to="/payments" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary" role="menuitem">
                      <CreditCard className="h-4 w-4 text-primary" /> Payments
                    </Link>
                    <Link to="/change-password" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary" role="menuitem">
                      <KeyRound className="h-4 w-4 text-primary" /> Change Password
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10" role="menuitem">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">
                  Log in
                </Link>
                <Link to="/signup" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link
              to={user ? "/cart" : "/login"}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-[60] lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!mobileOpen}>
        <div
          className={cn("absolute inset-0 bg-black/35 transition-opacity duration-300", mobileOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-lg font-black text-primary">DUNNKAYCE</div>
              <div className="text-xs text-muted-foreground">Swift Campus Feast</div>
            </div>
            <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 hover:bg-secondary" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
            {!user &&
              publicLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => goToHash(item.hash)}
                  className="flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-secondary"
                >
                  {item.label}
                </button>
              ))}
            <Link
              to={user ? "/orders" : "/login"}
              onClick={() => setMobileOpen(false)}
              className={cn("flex items-center rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-secondary", pathname === "/orders" && "bg-primary text-primary-foreground hover:bg-primary/90")}
            >
              My Orders
            </Link>
            <Link
              to={user ? "/cart" : "/login"}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-secondary"
            >
              <span>Cart</span>
              {cartCount > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">{cartCount}</span>}
            </Link>

            <div className="my-3 border-t border-border" />

            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-secondary">
                  <User className="h-4 w-4 text-primary" /> Profile
                </Link>
                <Link to="/payments" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-secondary">
                  <CreditCard className="h-4 w-4 text-primary" /> Payments
                </Link>
                <Link to="/change-password" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-secondary">
                  <KeyRound className="h-4 w-4 text-primary" /> Change Password
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-secondary">
                  Log in
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {user && (
            <div className="border-t border-border p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}