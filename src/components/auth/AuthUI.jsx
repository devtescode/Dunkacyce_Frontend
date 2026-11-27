import { Children, cloneElement, isValidElement, useState } from "react";
import {
  ArrowRight,
  Bike,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import { FoodImage } from "@/components/admin";
import { FOOD_HIGHLIGHTS } from "@/lib/foodImages";
import { cn } from "@/lib/utils";
import logo from "../../assest/elizade_university_ilara_mokin_profile.jpg";

const BRAND = {
  login: {
    eyebrow: "Student sign in",
    headline: (
      <>
        Good food.
        <span className="block text-gold">Zero hassle.</span>
      </>
    ),
    copy: "Your favourite campus meals are one sign-in away. Pick, pay, and we’ll bring the feast to you.",
    tagline: "Fresh campus meals, delivered.",
  },
  signup: {
    eyebrow: "Join the table",
    headline: (
      <>
        Campus meals,
        <span className="block text-gold">made effortless.</span>
      </>
    ),
    copy: "Create your account to order fresh, tasty meals and get them delivered right where you are on campus.",
    tagline: "Good food, right on campus.",
  },
};

const BENEFITS = [
  { label: "Fresh daily", icon: Sparkles },
  { label: "Campus delivery", icon: Bike },
  { label: "Secure checkout", icon: ShieldCheck },
];

/** Decorative backdrop for the forest brand panel. */
function BrandAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--color-gold) 26%, transparent), transparent 38%), radial-gradient(circle at 82% 78%, color-mix(in srgb, var(--color-fresh) 28%, transparent), transparent 46%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-gold/10 blur-3xl motion-safe:animate-[dk-float_9s_ease-in-out_infinite] motion-reduce:animate-none" />
      <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-fresh/15 blur-3xl" />
      <div className="absolute right-16 top-20 h-24 w-24 rounded-full border border-gold/25" />
      <div className="absolute bottom-32 left-16 h-16 w-16 rotate-45 rounded-2xl border border-white/10" />
    </div>
  );
}

function BrandMark({ compact = false }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-forest-deep/20 ring-1 ring-white/10 backdrop-blur-sm",
        compact ? "px-2.5 py-2" : "px-3 py-2.5 sm:px-4 sm:py-3",
      )}
    >
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-xl bg-white/95 p-1 shadow-sm",
          compact ? "h-9 w-9" : "h-11 w-11 sm:h-12 sm:w-12",
        )}
      >
        <img src={logo} alt="Elizade University, Ilara Mokin" className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">DUNNKAYCE</p>
        <p
          className={cn("truncate font-display font-semibold tracking-wide text-white", compact ? "text-sm" : "text-base sm:text-lg")}
          style={{ fontFamily: '"Bebas Neue", "Inter", sans-serif' }}
        >
          Swift Campus Feast
        </p>
      </div>
    </div>
  );
}

function BrandPanel({ mode }) {
  const brand = BRAND[mode] ?? BRAND.login;

  return (
    <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-forest-deep px-8 py-10 text-white lg:flex xl:px-12 xl:py-12">
      <BrandAtmosphere />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-6 select-none whitespace-nowrap font-display text-[13rem] font-black uppercase leading-none tracking-tighter text-white/[0.035] motion-safe:animate-[dk-float_14s_ease-in-out_infinite] motion-reduce:animate-none xl:text-[18rem] 2xl:text-[22rem]"
      >
        SCF
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <BrandMark />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
          Student access
        </span>
      </div>

      <div className="relative mt-10 xl:mt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">{brand.eyebrow}</p>
        <p
          className="mt-4 max-w-xl font-display text-4xl font-black uppercase leading-[0.98] tracking-[0.01em] sm:text-5xl xl:text-6xl 2xl:text-7xl"
          style={{ fontFamily: '"Bebas Neue", "Inter", sans-serif' }}
        >
          {brand.headline}
        </p>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">{brand.copy}</p>
      </div>

      <div className="relative mt-8 grid grid-cols-3 gap-2 xl:mt-10">
        {BENEFITS.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-2.5 backdrop-blur-sm sm:gap-2.5 sm:px-3"
          >
            <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/90 sm:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-8 xl:mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">Today’s menu</p>
            <p className="mt-1 text-xs text-white/60">A little taste of campus dining</p>
          </div>
          <UtensilsCrossed className="h-4 w-4 text-white/50" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-3 gap-2.5 xl:gap-3">
          {FOOD_HIGHLIGHTS.slice(0, 3).map((item) => (
            <div key={item.name} className="relative">
              <FoodImage
                src={item.src}
                alt={`Illustrative food photography: ${item.name}`}
                ratio="aspect-[4/3]"
                className="rounded-xl shadow-lg shadow-forest-deep/30 ring-1 ring-white/20 xl:rounded-2xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-forest-deep/90 to-transparent px-2 pb-1.5 pt-6 xl:rounded-b-2xl xl:px-3 xl:pb-2.5"
              >
                <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-white xl:text-xs">
                  {item.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-auto flex items-center gap-2 pt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
        <span>DUNNKAYCE</span>
        <span className="h-1 w-1 rounded-full bg-gold" aria-hidden="true" />
        <span>Swift Campus Feast</span>
        <Sparkles className="ml-auto h-3.5 w-3.5 text-gold" aria-hidden="true" />
      </div>
    </aside>
  );
}

/**
 * Full-bleed split-shell for student authentication. Navbar/Footer are hidden
 * by the root route for these pages; the compact mobile header is branding only.
 */
export function AuthLayout({ mode, title, description, children, footer, className }) {
  const brand = BRAND[mode] ?? BRAND.login;

  return (
    <main className={cn("relative min-h-screen overflow-hidden bg-background text-foreground", className)}>
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <BrandPanel mode={mode} />

        <section className="relative flex min-h-screen min-w-0 flex-col bg-background px-4 py-6 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
          />
          <div className="relative lg:hidden">
            <div className="mx-auto flex w-full max-w-[440px] items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-forest-deep p-1 shadow-sm">
                  <img src={logo} alt="Elizade University, Ilara Mokin" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">DUNNKAYCE</p>
                  <p className="truncate text-sm font-semibold text-foreground">Swift Campus Feast</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {brand.eyebrow}
              </span>
            </div>
            <p className="mx-auto mt-2 w-full max-w-[440px] text-xs text-muted-foreground">{brand.tagline}</p>
          </div>

          <div className="relative flex flex-1 items-center justify-center py-6 sm:py-8 lg:py-0">
            <div className="w-full max-w-[440px] rounded-3xl border border-border/80 bg-card p-6 shadow-[0_28px_70px_-40px_color-mix(in_srgb,var(--color-forest-deep)_55%,transparent)] sm:p-8">
              <header className="mb-6">
                <h1
                  className="font-display text-3xl font-black uppercase leading-[1.05] tracking-[0.01em] text-foreground sm:text-4xl"
                  style={{ fontFamily: '"Bebas Neue", "Inter", sans-serif' }}
                >
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </header>

              {children}

              {footer ? (
                <footer className="mt-7 border-t border-border pt-6 text-sm text-muted-foreground">{footer}</footer>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/** Labelled field shell with an icon tile, optional trailing control, and inline status. */
export function AuthField({ id, label, icon: Icon, error, hint, trailing, children, className }) {
  const statusIds = error ? `${id}-error` : hint ? `${id}-hint` : "";

  const fields = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const existing = child.props["aria-describedby"];
    const describedBy = [existing, statusIds].filter(Boolean).join(" ") || undefined;
    return cloneElement(child, {
      "aria-describedby": describedBy,
      ...(error ? { "aria-invalid": true } : {}),
    });
  });

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>

      <div
        className={cn(
          "relative flex min-h-[56px] items-center rounded-2xl border border-input bg-background transition-all duration-200 hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/15 motion-reduce:transition-none",
          error &&
            "border-destructive/60 hover:border-destructive/60 focus-within:border-destructive/70 focus-within:ring-destructive/15",
        )}
      >
        {Icon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}

        {fields}

        {trailing ? <div className="absolute right-2 flex items-center">{trailing}</div> : null}
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Bare input for AuthField; optionally self-contained when icon/trailing are supplied. */
export function AuthInput({ icon: Icon, trailing, className, ...inputProps }) {
  const input = (
    <input
      {...inputProps}
      className={cn(
        "w-full min-w-0 flex-1 bg-transparent py-3.5 pl-14 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    />
  );

  if (!Icon && !trailing) return input;

  return (
    <div
      className={cn(
        "relative flex min-h-[56px] items-center rounded-2xl border border-input bg-background transition-all duration-200 hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/15 motion-reduce:transition-none",
        inputProps["aria-invalid"] &&
          "border-destructive/60 hover:border-destructive/60 focus-within:border-destructive/70 focus-within:ring-destructive/15",
      )}
    >
      {Icon ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      {input}
      {trailing ? <div className="absolute right-2 flex items-center">{trailing}</div> : null}
    </div>
  );
}

/** Password field with an accessible reveal toggle. */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  hint,
  disabled,
  minLength,
  required,
  name,
}) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? "Hide password" : "Show password";
  const RevealIcon = visible ? EyeOff : Eye;

  return (
    <AuthField
      id={id}
      label={label}
      icon={Lock}
      error={error}
      hint={hint}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label="Toggle password visibility"
          aria-pressed={visible}
          title={toggleLabel}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:bg-primary/15 focus-visible:text-primary disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          <RevealIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      }
    >
      <AuthInput
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="pr-16"
        aria-invalid={Boolean(error)}
      />
    </AuthField>
  );
}

export function AuthSubmit({ isPending, idleLabel, pendingLabel }) {
  return (
    <>
      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending || undefined}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold uppercase tracking-[0.08em] text-primary-foreground shadow-lg shadow-forest-deep/25 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
      >
        {isPending ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-[dk-spin_1.1s_linear_infinite] rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground motion-reduce:animate-none"
            />
            <span>{pendingLabel}</span>
          </>
        ) : (
          <>
            {idleLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {isPending ? pendingLabel : null}
      </span>
    </>
  );
}
