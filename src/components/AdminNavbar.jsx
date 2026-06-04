import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard, Box, Camera, Truck, CreditCard, Users, MapPin, ShieldCheck, KeyRound, MessageCircle, LogOut } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { to: "/admin-dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin-dashboard-food-management", label: "Food Management", icon: Box },
  // { to: "/admin-dashboard/image-upload", label: "Image Upload", icon: Camera },
  { to: "/admin-dashboard-order-management", label: "Order Management", icon: Truck },
  { to: "/admin-dashboard-student-cart", label: "Student Cart", icon: Truck },

  { to: "/admin-dashboard-payment-tracking", label: "Payment Tracking", icon: CreditCard },
  { to: "/admin-dashboard-user-analytics", label: "User Analytics", icon: Users },
  { to: "/admin-dashboard-delivery-management", label: "Delivery Management", icon: MapPin },
  { to: "/admin-dashboard-system-settings", label: "System Settings", icon: ShieldCheck },
  { to: "/admin-dashboard-change-password", label: "Change Password", icon: KeyRound },
];

export function AdminNavbar({ children }) {
  const pathname = useRouterState({ select: (router) => router.location?.pathname ?? "" });
  const navigate = useNavigate();
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
    navigate({ to: "/adminlogin", replace: true });
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/2348000000000?text=Hi%20Dunnkayce%20support", "_blank");
  };

  if (!pathname.startsWith("/admin-dashboard")) {
    return children ?? null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-background/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin-dashboard" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
              A
            </span>
            Admin
          </Link>
          <button onClick={() => setOpen(true)} className="rounded-2xl border border-input bg-white p-2 shadow-sm transition hover:bg-slate-100" aria-label="Open admin menu">
            <Menu className="h-5 w-5 text-slate-900" />
          </button>
        </div>
      </div>

      <div className="lg:flex lg:min-h-[calc(100vh-0px)]">
        <aside className={cn(
          "hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-80 lg:flex-col lg:border-r lg:border-input lg:bg-card lg:px-4 lg:py-6 lg:overflow-y-auto lg:max-h-screen",
          desktopLoaded ? "lg:transition-transform lg:duration-300 lg:ease-in-out" : "lg:transition-none",
          desktopLoaded ? (desktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full") : "lg:opacity-0"
        )}>
          {/* <div className="mb-6 px-2">
            <Link to="/admin-dashboard" className="flex items-center gap-3 rounded-3xl bg-primary px-4 py-4 text-lg font-semibold text-primary-foreground shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
              Admin Panel
            </Link>
          </div> */}
          <nav className="space-y-1 px-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-primary text-primary-foreground shadow" : "text-foreground hover:bg-primary/5"
                  )}
                >
                  <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", active ? "bg-primary/20 text-primary" : "bg-background text-muted-foreground")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-input bg-background p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Admin actions</p>
            <button onClick={openWhatsApp} className="mt-3 w-full rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Support
            </button>
            <button onClick={handleLogout} className="mt-3 w-full rounded-2xl border border-destructive px-3 py-2 text-sm font-semibold text-destructive">
              Logout
            </button>
          </div>
        </aside>

        <div className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          !desktopLoaded && "lg:transition-none",
          desktopOpen ? "lg:ml-80" : "lg:ml-0",
          open ? "translate-x-[72%] sm:translate-x-[60%]" : "translate-x-0"
        )}>
          <div className="hidden items-center justify-between gap-3 border-b border-slate-200 px-4 pb-4 pt-2 text-slate-700 lg:flex">
            <button
              onClick={() => setDesktopOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-sm border-none bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-50"
            >
              {desktopOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              {desktopOpen ? "Open" : "Close"} sidebar
            </button>
            <p className="text-sm"><button onClick={handleLogout} className="mt-3 w-full rounded-sm border-none bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              <LogOut className="h-4 w-4" /> 
            </button></p>
            
          </div>

          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-primary to-secondary px-4 py-4 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
                A
              </span>
              <div>
                <p className="text-sm font-semibold">Admin Menu</p>
                <p className="text-xs text-slate-100/80">Swift control center</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-2xl bg-white/15 p-2 text-white transition hover:bg-white/25" aria-label="Close menu">
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
                  className={cn(
                    "flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "grid h-11 w-11 place-items-center rounded-2xl",
                    active ? "bg-white text-slate-900" : "bg-slate-200 text-slate-600"
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Need help?</p>
            <p className="mt-2 text-sm text-slate-600">Chat with support or logout when you’re done.</p>
            <button onClick={openWhatsApp} className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Support Chat
            </button>
            <button onClick={handleLogout} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Logout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
