import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";

import { useUpdateProfileMutation } from "@/lib/api";
import { getSessionUser, setSessionUser } from "@/lib/session";
import { store } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Dunnkayce" }] }),
  component: ProfilePage,
});

const VALID_GENDERS = ["Male", "Female"];

function normalizeGender(gender) {
  return VALID_GENDERS.includes(gender) ? gender : "Male";
}

function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const [user, setUser] = useState(() => getSessionUser());
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "Male",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const updateProfile = useUpdateProfileMutation();

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setUser(sessionUser);
        setForm({
          fullName: sessionUser.fullName || "",
          email: sessionUser.email || "",
          phone: sessionUser.phone || "",
          gender: normalizeGender(sessionUser.gender),
        });
        store.syncUser(sessionUser);
        return;
      }
      navigate({ to: "/login" });
    } else {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: normalizeGender(user.gender),
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  if (!user) return null;

  const avatarSrc =
    photoPreview ||
    (typeof user.profilePicture === "string" && user.profilePicture.trim()
      ? user.profilePicture.trim()
      : "");

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      e.target.value = "";
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;
    setPhotoFile(file);
    setPhotoPreview(nextPreview);
  };

  const save = async (e) => {
    e.preventDefault();

    const gender = normalizeGender(form.gender);
    if (!VALID_GENDERS.includes(gender)) {
      toast.error("Please select a valid gender");
      return;
    }

    const payload = photoFile ? new FormData() : {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      gender,
    };

    if (photoFile) {
      payload.append("profilePicture", photoFile);
      payload.append("fullName", form.fullName);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      payload.append("gender", gender);
    }

    try {
      const data = await updateProfile.mutateAsync(payload);
      const updatedUser = data?.user
        ? { ...getSessionUser(), ...data.user }
        : {
            ...(getSessionUser() ?? user ?? {}),
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            gender,
          };

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-4xl mb-6">Profile</h1>
      <form onSubmit={save} className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex flex-col gap-4 pb-4 border-b sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${form.fullName || user.fullName || "User"} profile picture`}
                className="h-20 w-20 rounded-full object-cover border bg-background"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-3xl">
                {(form.fullName || user.fullName || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background text-foreground shadow-sm hover:bg-accent"
              aria-label="Change profile picture"
              title="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-lg truncate">{form.fullName || user.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {user.role === "admin" ? "Administrator" : "Student"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
                {photoFile ? "Change photo" : "Upload photo"}
              </label>
              {photoFile ? (
                <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {photoFile.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, or WEBP
                </span>
              )}
            </div>
          </div>
        </div>

        {[
          { k: "fullName", l: "Full name", type: "text" },
          { k: "email", l: "Email", type: "email" },
          { k: "phone", l: "Phone", type: "tel" },
        ].map(({ k, l, type }) => (
          <label key={k} className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {l}
            </span>
            <input
              type={type}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              required={k !== "phone"}
            />
          </label>
        ))}

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Gender
          </span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}