import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";

export const Route = createFileRoute("/admin")({
  component: AdminEntryPage,
});

function AdminEntryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    const stored = sessionStorage.getItem("admin");

    let isAuthenticated = false;
    if (token && stored) {
      try {
        JSON.parse(stored);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    navigate({
      to: isAuthenticated ? "/admin-dashboard" : "/adminlogin",
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <DunnkayceLoader
        variant="page"
        label="Opening admin portal"
        caption="Checking your session and taking you to the right place."
      />
    </div>
  );
}
