import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X, LayoutDashboard, Box, ClipboardList, ShoppingCart, KeyRound, LogOut } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/session";
import { store } from "@/lib/store";

const adminNavItems = [
  { to: "/admin-dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin-dashboard-food-management", label: "Food Management", icon: Box },
  // { to: "/admin-dashboard/image-upload", label: "Image Upload", icon: Camera },
  { to: "/admin-dashboard-order-management", label: "Order Management", icon: ClipboardList },
  { to: "/admin-dashboard-student-cart", label: "Student Cart", icon: ShoppingCart },

  // { to: "/admin-dashboard-payment-tracking", label: "Payment Tracking", icon: CreditCard },
  // { to: "/admin-dashboard-user-analytics", label: "User Analytics", icon: Users },
  // { to: "/admin-dashboard-delivery-management", label: "Delivery Management", icon: MapPin },
  // { to: "/admin-dashboard-system-settings", label: "System Settings", icon: ShieldCheck },
  { to: "/admin-dashboard-change-password", label: "Change Password", icon: KeyRound },
];

export function AdminNavbar({ children }) {
  const pathname = useRouterState({ select: (router) => router.location?.pathname ?? "" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [desktopLoaded, setDesktopLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("adminDesktopSidebarOpen");
    setDesktopOpen(stored === null ? true : stored === "true");
    setDesktopLoaded(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (event) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setOpen(false);
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    if (!open) {
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleMediaChange);
        } else {
          mediaQuery.removeListener(handleMediaChange);
        }
      };
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("adminDesktopSidebarOpen", desktopOpen ? "true" : "false");
  }, [desktopOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");
    store.logout();
    clearSession();
    queryClient.clear();
    navigate({ to: "/adminlogin", replace: true });
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/2348000000000?text=Hi%20Dunnkayce%20support", "_blank");
  };

  if (!pathname.startsWith("/admin-dashboard")) {
    return children ?? null;
  }

  const sidebarToggleLabel = desktopOpen ? "Collapse sidebar" : "Expand sidebar";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/70 bg-card/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin-dashboard" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              D
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-foreground">Dunnkayce Admin</span>
              <span className="block text-xs text-muted-foreground">Control center</span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition hover:bg-accent"
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="lg:flex lg:min-h-[calc(100vh-0px)]">
        <aside
          id="admin-sidebar"
          className={cn(
            "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-80 lg:max-h-screen lg:flex-col lg:overflow-y-auto lg:border-r lg:border-border/70 lg:bg-card/95 lg:px-4 lg:py-5 lg:backdrop-blur",
            desktopLoaded ? "lg:transition-transform lg:duration-300 lg:ease-in-out" : "lg:transition-none",
            desktopLoaded ? (desktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full") : "lg:opacity-0"
          )}
        >
          <div className="mb-6 rounded-3xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <Link to="/admin-dashboard" className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
                D
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold text-foreground">Dunnkayce Admin</span>
                <span className="block text-xs text-muted-foreground">Control center</span>
              </span>
            </Link>
          </div>

          <nav className="space-y-1.5 px-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-primary/10 text-foreground ring-1 ring-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl border transition",
                      active
                        ? "border-primary/20 bg-primary text-primary-foreground"
                        : "border-border/70 bg-background text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Admin actions</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Get support or securely end your session.
            </p>
            <button
              onClick={openWhatsApp}
              className="mt-4 w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              Support
            </button>
            <button
              onClick={handleLogout}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-background px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            !desktopLoaded && "lg:transition-none",
            desktopOpen ? "lg:ml-80" : "lg:ml-0"
          )}
        >
          <div className="hidden items-center justify-between gap-3 border-b border-border/70 bg-card/60 px-4 py-3 backdrop-blur lg:flex lg:px-6">
            <button
              onClick={() => setDesktopOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent"
              aria-label={sidebarToggleLabel}
              aria-expanded={desktopOpen}
              aria-controls="admin-sidebar"
            >
              {desktopOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              {sidebarToggleLabel}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs overflow-y-auto border-r border-border/70 bg-card px-4 py-5 shadow-2xl transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/70 bg-background/80 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                D
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Dunnkayce Admin</p>
                <p className="text-xs text-muted-foreground">Control center</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground transition hover:bg-accent"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-5 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-primary/10 text-foreground ring-1 ring-primary/20 shadow-sm"
                      : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl border",
                      active
                        ? "border-primary/20 bg-primary text-primary-foreground"
                        : "border-border/70 bg-card text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-3xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Need help?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Chat with support or logout when you’re done.
            </p>
            <button
              onClick={openWhatsApp}
              className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Support Chat
            </button>
            <button
              onClick={handleLogout}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
