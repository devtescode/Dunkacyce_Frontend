import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouterState,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { store } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

function RootShell({ children }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dunnkayce — Campus Food Ordering" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // {
      //   rel: "stylesheet",
      //   href:
      //     "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap",
      // },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    const token =
      sessionStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      store.get().authToken;

    const user = sessionStorage.getItem("user");

    if (user) {
      try {
        store.syncUser(JSON.parse(user));
      } catch {}
    }

    if (token) sessionStorage.setItem("token", token);
    setSessionLoaded(true);
  }, []);

  const pathname = useRouterState({
    select: (r) => r.location.pathname,
  });

  const isAdmin = pathname?.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        {!isAdmin && <Navbar />}

        <div className="flex-1">
          {sessionLoaded ? (
            <Outlet />
          ) : (
            <div className="flex min-h-screen items-center justify-center">
              Loading...
            </div>
          )}
        </div>
      </div>

      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}