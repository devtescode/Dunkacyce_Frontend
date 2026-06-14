import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/session";
import { toast } from "sonner";


const BASE = "https://dunkacyce-backend.onrender.com";
export const Route = createFileRoute("/change-password")({
  head: () => ({
    meta: [{ title: "Change Password — Dunnkayce" }],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => getSessionUser());

  const [loading, setLoading] = useState(false);

  const [f, setF] = useState({
    old: "",
    next: "",
    confirm: "",
  });

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();

      if (sessionUser) {
        setUser(sessionUser);
        return;
      }

      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  if (!user) return null;

  const submit = async (e) => {
    e.preventDefault();

    if (!f.old.trim()) {
      return toast.error("Current password is required");
    }

    if (f.next.length < 6) {
      return toast.error(
        "New password must be at least 6 characters"
      );
    }

    if (f.next !== f.confirm) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const response = await fetch(
        // `http://localhost:5000/dunnkayce/change-password`,
        `${BASE}/dunnkayce/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: f.old,
            newPassword: f.next,
          }),
        }
      );
      console.log("Response status:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update password"
        );
      }

      toast.success(
        data.message || "Password updated successfully"
      );

      setF({
        old: "",
        next: "",
        confirm: "",
      });
    } catch (error) {
      toast.error(
        error?.message || "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display mb-4 text-4xl">
        Change Password
      </h1>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-sm border bg-card p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current Password
          </span>

          <input
            type="password"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={f.old}
            onChange={(e) =>
              setF({
                ...f,
                old: e.target.value,
              })
            }
            placeholder="Enter current password"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            New Password
          </span>

          <input
            type="password"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={f.next}
            onChange={(e) =>
              setF({
                ...f,
                next: e.target.value,
              })
            }
            placeholder="Enter new password"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Confirm New Password
          </span>

          <input
            type="password"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={f.confirm}
            onChange={(e) =>
              setF({
                ...f,
                confirm: e.target.value,
              })
            }
            placeholder="Confirm new password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className=" rounded-sm bg-primary py-2.5 px-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </main>
  );
}

export default ChangePasswordPage;