import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Box,
  ClipboardList,
  ShoppingCart,
  KeyRound,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/admin";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/session";
import { store } from "@/lib/store";
import { disconnectAdminSocket } from "@/lib/socket";

const adminNavItems = [
  { to: "/admin-dashboard", label: "Overview", icon: LayoutDashboard, group: "Overview" },
  { to: "/admin-dashboard-users", label: "Users", icon: Users, group: "Operations" },
  { to: "/admin-dashboard-food-management", label: "Food Management", icon: Box, group: "Operations" },
  // { to: "/admin-dashboard/image-upload", label: "Image Upload", icon: Camera },
  { to: "/admin-dashboard-order-management", label: "Order Management", icon: ClipboardList, group: "Operations" },
  { to: "/admin-dashboard-student-cart", label: "Student Cart", icon: ShoppingCart, group: "Operations" },

  // { to: "/admin-dashboard-payment-tracking", label: "Payment Tracking", icon: CreditCard },
  // { to: "/admin-dashboard-user-analytics", label: "User Analytics", icon: Users },
  // { to: "/admin-dashboard-delivery-management", label: "Delivery Management", icon: MapPin },
  // { to: "/admin-dashboard-system-settings", label: "System Settings", icon: ShieldCheck },
  { to: "/admin-dashboard-change-password", label: "Change Password", icon: KeyRound, group: "Security" },
];

const navGroups = ["Overview", "Operations", "Security"];

// Layered forest finish: soft radial light from the top-left plus a fine grain pass.
const sidebarGradient =
  "[background-image:radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,0.09),transparent_55%),linear-gradient(180deg,#073323_0%,#0a3f2b_58%,#062a1c_100%)]";
const grainOverlay =
  "[background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_4px)]";

function AdminNavLink({ item, active, onNavigate, mobile = false }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      title={item.label}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-fresh/70",
        mobile ? "px-3 py-3 text-sm" : "px-3 py-2.5 text-sm",
        active
          ? "bg-fresh/15 text-white ring-1 ring-fresh/30"
          : "text-emerald-50/70 hover:bg-white/[0.07] hover:text-white"
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold"
        />
      ) : null}
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl border transition",
          mobile ? "h-10 w-10" : "h-9 w-9",
          active
            ? "border-fresh/40 bg-fresh text-forest-deep shadow-md"
            : "border-white/10 bg-white/5 text-emerald-100/70 group-hover:text-white"
        )}
      >
        <Icon className={mobile ? "h-[18px] w-[18px]" : "h-4 w-4"} aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

function SidebarNav({ pathname, onNavigate, mobile = false }) {
  return (
    <nav aria-label="Admin sections" className={cn("px-1", mobile ? "mt-4 space-y-3" : "space-y-1")}>
      <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-gold/80">
        Workspaces
      </p>
      {navGroups.map((group) => {
        const items = adminNavItems.filter((item) => item.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/40">
              {group}
            </p>
            <div className="space-y-1">
              {items.map((item) => (
                <AdminNavLink
                  key={item.to}
                  item={item}
                  active={pathname === item.to}
                  onNavigate={onNavigate}
                  mobile={mobile}
                />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarStatus({ onSupport, onLogout }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="relative grid h-2.5 w-2.5 place-items-center" aria-hidden="true">
          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-fresh opacity-50 motion-reduce:animate-none" />
          <span className="h-2 w-2 rounded-full bg-fresh" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white">Operations online</p>
          <p className="text-[11px] text-emerald-100/55">All systems responsive</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <ThemeToggle compact className="text-emerald-50 hover:bg-white/10" />
        <button
          type="button"
          onClick={onSupport}
          className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-emerald-50/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fresh/70"
        >
          Support
        </button>
        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          aria-label="Logout"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-50/80 transition hover:border-rose-300/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fresh/70"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function AdminNavbar({ children }) {
  const pathname = useRouterState({ select: (router) => router.location?.pathname ?? "" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [desktopLoaded, setDesktopLoaded] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("adminDesktopSidebarOpen");
    setDesktopOpen(stored === null ? true : stored === "true");
    setDesktopLoaded(true);
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

    const removeMediaListener = () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };

    if (!open) {
      return removeMediaListener;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      removeMediaListener();
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("adminDesktopSidebarOpen", desktopOpen ? "true" : "false");
  }, [desktopOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");
    disconnectAdminSocket();
    store.logout();
    clearSession();
    queryClient.clear();
    navigate({ to: "/adminlogin", replace: true });
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/2348000000000?text=Hi%20Dunnkayce%20support", "_blank", "noopener,noreferrer");
  };

  const closeDrawer = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  if (!pathname.startsWith("/admin-dashboard")) {
    return children ?? null;
  }

  const activeItem = adminNavItems.find((item) => pathname === item.to);
  const currentLabel = activeItem?.label ?? "Preview workspace";
  const isPreview = !activeItem;
  const sidebarToggleLabel = desktopOpen ? "Collapse sidebar" : "Expand sidebar";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile brand bar */}
      <div className="relative isolate overflow-hidden border-b border-white/10 bg-forest-deep text-white lg:hidden">
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", sidebarGradient)} />
        <div className="relative mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-4 py-3">
          <Link to="/admin-dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fresh to-emerald-600 font-display text-base text-white shadow-lg">
              DK
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base tracking-wider text-white">DUNNKAYCE</span>
              <span className="block truncate text-[11px] text-emerald-100/65">Swift Campus Feast</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle compact className="text-emerald-50 hover:bg-white/10" />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white shadow-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fresh/70"
              aria-label="Open admin menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:min-h-[calc(100vh-0px)]">
        {/* Desktop fixed sidebar */}
        <aside
          id="admin-sidebar"
          className={cn(
            "relative hidden overflow-hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-80 lg:max-h-screen lg:flex-col lg:border-r lg:border-white/10 lg:px-4 lg:py-5",
            "bg-forest-deep text-emerald-50 shadow-2xl",
            sidebarGradient,
            desktopLoaded ? "lg:transition-transform lg:duration-300 lg:ease-in-out" : "lg:transition-none",
            desktopLoaded ? (desktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full") : "lg:opacity-0"
          )}
        >
          <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", grainOverlay)} />
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Link to="/admin-dashboard" className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fresh to-emerald-600 font-display text-lg text-white shadow-lg">
                  DK
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg tracking-wider text-white">DUNNKAYCE</span>
                  <span className="block truncate text-[11px] text-emerald-100/65">Swift Campus Feast</span>
                </span>
              </Link>
              <span aria-hidden="true" className="mt-3 block h-0.5 w-9 rounded-full bg-gold" />
            </div>

            <SidebarNav pathname={pathname} />

            <div className="mt-auto pt-5">
              <SidebarStatus onSupport={openWhatsApp} onLogout={handleLogout} />
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "min-w-0 flex-1 transition-all duration-300 ease-in-out",
            !desktopLoaded && "lg:transition-none",
            desktopOpen ? "lg:ml-80" : "lg:ml-0"
          )}
        >
          {/* Desktop top bar */}
          <div className="hidden items-center justify-between gap-3 border-b border-border/70 bg-card/70 px-4 py-3 backdrop-blur lg:flex lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDesktopOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={sidebarToggleLabel}
                title={sidebarToggleLabel}
                aria-expanded={desktopOpen}
                aria-controls="admin-sidebar"
              >
                {desktopOpen ? (
                  <X className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
                <span className="shrink-0 text-muted-foreground">Admin</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                <span className="truncate font-semibold text-foreground">{currentLabel}</span>
              </nav>
              {isPreview ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
                  Preview workspace · no live navigation
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle compact />
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition hover:border-destructive/30 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile drawer — inert while closed keeps every control out of the tab order. */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close admin menu"
          onClick={closeDrawer}
          className="absolute inset-0 h-full w-full cursor-default bg-forest-deep/60 backdrop-blur-sm"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={cn(
            "fixed inset-y-0 left-0 z-[60] flex w-[86%] max-w-xs flex-col overflow-hidden border-r border-white/10 bg-forest-deep text-emerald-50 shadow-2xl transition-transform duration-300 ease-in-out",
            sidebarGradient,
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", grainOverlay)} />
          <div className="relative z-10 flex flex-1 flex-col overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fresh to-emerald-600 font-display text-lg text-white shadow-lg">
                  DK
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base tracking-wider text-white">DUNNKAYCE</p>
                  <p className="truncate text-[11px] text-emerald-100/65">Swift Campus Feast</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fresh/70"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <SidebarNav pathname={pathname} onNavigate={closeDrawer} mobile />

            <div className="mt-auto p-4 pt-6">
              <SidebarStatus onSupport={openWhatsApp} onLogout={handleLogout} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
