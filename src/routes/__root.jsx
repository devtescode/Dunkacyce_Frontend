import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts, } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";
function NotFoundComponent() {
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Go home</Link>
      </div>
    </div>);
}
function ErrorComponent({ error, reset }) {
    console.error(error);
    const router = useRouter();
    useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try refreshing.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try again</button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Go home</a>
        </div>
      </div>
    </div>);
}
export const Route = createRootRouteWithContext()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "Dunnkayce — Campus Food Ordering" },
            { name: "description", content: "Order hot meals from your hostel. Dunnkayce campus food delivery." },
            { property: "og:title", content: "Dunnkayce — Campus Food Ordering" },
            { name: "twitter:title", content: "Dunnkayce — Campus Food Ordering" },
            { property: "og:description", content: "Order hot meals from your hostel. Dunnkayce campus food delivery." },
            { name: "twitter:description", content: "Order hot meals from your hostel. Dunnkayce campus food delivery." },
            { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5c32614c-4beb-465e-9ef9-3dbce3f9f510/id-preview-00f593df--46d4c8d4-b7c4-4ed3-92d0-c2c7820b8bf3.lovable.app-1780402268375.png" },
            { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5c32614c-4beb-465e-9ef9-3dbce3f9f510/id-preview-00f593df--46d4c8d4-b7c4-4ed3-92d0-c2c7820b8bf3.lovable.app-1780402268375.png" },
            { name: "twitter:card", content: "summary_large_image" },
            { property: "og:type", content: "website" },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "preconnect", href: "https://fonts.googleapis.com" },
            { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" },
        ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
});
function RootShell({ children }) {
    return (<html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>);
}
function RootComponent() {
    const { queryClient } = Route.useRouteContext();
    return (<QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1"><Outlet /></div>
        <RouteAwareFooter />
      </div>
      <Toaster richColors position="top-center"/>
    </QueryClientProvider>);
}
function RouteAwareFooter() {
    const router = useRouter();
    const path = router.state.location.pathname;
    if (path === "/login" || path === "/signup" || path === "/adminlogin" || path === "/admin-dashboard" 
      
    )
        return null;
    return <Footer />;
}
