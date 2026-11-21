import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Mail, Phone, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfileMutation } from "@/lib/api";
import { getSessionUser, setSessionUser } from "@/lib/session";
import { store } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — DUNNKAYCE" }] }),
  component: ProfilePage,
});

const VALID_GENDERS = ["Male", "Female"];
const normalizeGender = (gender) => (VALID_GENDERS.includes(gender) ? gender : "Male");

function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const [user, setUser] = useState(() => getSessionUser());
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", gender: "Male" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const updateProfile = useUpdateProfileMutation();

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      navigate({ to: "/login", replace: true });
      return;
    }
    setUser(sessionUser);
    setForm({
      fullName: sessionUser.fullName || "",
      email: sessionUser.email || "",
      phone: sessionUser.phone || "",
      gender: normalizeGender(sessionUser.gender),
    });
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  if (!user) return null;

  const avatarSrc =
    photoPreview ||
    (typeof user.profilePicture === "string" && user.profilePicture.trim() ? user.profilePicture.trim() : "");

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      e.target.value = "";
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;
    setPhotoFile(file);
    setPhotoPreview(nextPreview);
  };

  const save = async (e) => {
    e.preventDefault();
    const gender = normalizeGender(form.gender);
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!fullName) return toast.error("Full name is required");
    if (!email) return toast.error("Email is required");

    const payload = photoFile ? new FormData() : { fullName, email, phone, gender };
    if (photoFile) {
      payload.append("profilePicture", photoFile);
      payload.append("fullName", fullName);
      payload.append("email", email);
      payload.append("phone", phone);
      payload.append("gender", gender);
    }

    try {
      const data = await updateProfile.mutateAsync(payload);
      const updatedUser = data?.user
        ? { ...(getSessionUser() ?? user), ...data.user }
        : { ...(getSessionUser() ?? user), fullName, email, phone, gender };

      setSessionUser(updatedUser);
      store.syncUser(updatedUser);
      setUser(getSessionUser() ?? updatedUser);

      if (photoFile) {
        setPhotoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = "";
        }
        setPhotoPreview("");
      }

      toast.success(data?.message || "Profile updated");
    } catch (error) {
      toast.error(error?.message || "Failed to update profile");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Profile</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">Your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your personal information and profile photo.</p>
      </div>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${form.fullName || "User"} profile picture`}
                  className="h-28 w-28 rounded-full object-cover border border-border bg-background"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-3xl font-black text-primary-foreground">
                  {(form.fullName || user.fullName || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-secondary"
                aria-label="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-4 text-xl font-bold">{form.fullName || user.fullName}</h2>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              {user.role === "admin" ? "Administrator" : "Student"}
            </p>

            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary">
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
              {photoFile ? "Change photo" : "Upload photo"}
            </label>
            <p className="mt-2 text-xs text-muted-foreground">{photoFile ? photoFile.name : "JPG, PNG, or WEBP"}</p>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="profile-fullName" icon={User} className="sm:col-span-2">
              <input id="profile-fullName" autoComplete="name" className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </Field>

            <Field label="Email" htmlFor="profile-email" icon={Mail}>
              <input id="profile-email" type="email" autoComplete="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>

            <Field label="Phone" htmlFor="profile-phone" icon={Phone}>
              <input id="profile-phone" type="tel" autoComplete="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>

            <Field label="Gender" htmlFor="profile-gender" className="sm:col-span-2">
              <select id="profile-gender" className={inputClassPlain} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
          </div>

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {updateProfile.isPending ? "Saving..." : "Save changes"}
          </button>
        </section>
      </form>
    </main>
  );
}

const inputClassPlain = "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10";
const inputClass = "h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10";

function Field({ label, htmlFor, icon: Icon, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
      {Icon ? (
        <div className="relative">
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {children}
        </div>
      ) : children}
    </div>
  );
}