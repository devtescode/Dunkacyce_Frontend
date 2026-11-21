import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { store, useStore } from "@/lib/store";
import { getSessionToken, setSessionToken } from "@/lib/session";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

function RootShell({ children }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} richColors position="top-center" />;
}

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DUNNKAYCE — Swift Campus Feast" },
      {
        name: "description",
        content:
          "Order your favourite campus meals with ease. Fresh. Tasty. Delivered.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  shellComponent: RootShell,
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    const token =
      getSessionToken() ||
      localStorage.getItem("authToken") ||
      store.get().authToken;

    const user = sessionStorage.getItem("user");

    if (user) {
      try {
        store.syncUser(JSON.parse(user));
      } catch {}
    }

    if (token) setSessionToken(token);
    setSessionLoaded(true);
  }, []);

  const pathname = useRouterState({
    select: (r) => r.location.pathname,
  });

  const isLoggedIn = useStore((s) => Boolean(s.currentUserId));
  const isAdmin = pathname?.startsWith("/admin");
  const isAuthAppRoute = [
    "/user-dashboard",
    "/cart",
    "/checkout",
    "/orders",
    "/payments",
    "/profile",
    "/change-password",
  ].includes(pathname);
  const hideFooter = isAdmin || (isLoggedIn && isAuthAppRoute);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        {!isAdmin && <Navbar />}

          <div className="flex-1">
            {sessionLoaded ? (
              <Outlet />
            ) : (
              <div className="flex min-h-[70vh] items-center justify-center">
                <DunnkayceLoader
                  variant="page"
                  label="Warming up DUNNKAYCE"
                  caption="Getting your campus feast ready."
                />
              </div>
            )}
          </div>

          {!hideFooter && <Footer />}
        </div>

      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}