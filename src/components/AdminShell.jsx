import { AdminNavbar } from "@/components/AdminNavbar";

export function AdminShell({ children }) {
  return (
    <AdminNavbar>
      <div className="rounded-[32px] border border-input bg-background p-6 shadow-sm">
        {children}
      </div>
    </AdminNavbar>
  );
}
