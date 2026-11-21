import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BadgeCheck,
  GraduationCap,
  Mail,
  MapPin,
  Package,
  Phone,
  UserRound,
  Wallet,
} from "lucide-react";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";

const EMPTY = "—";

/** Convert any incoming value into a trimmed string without throwing. */
function text(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** a***@x.com */
function maskEmail(value) {
  const email = text(value);
  if (!email) return EMPTY;

  const at = email.indexOf("@");
  if (at <= 0) return `${email[0]}***`;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local) return `***@${domain}`;
  return `${local[0]}***@${domain}`;
}

/** 080*****78 */
function maskPhone(value) {
  const phone = text(value);
  if (!phone) return EMPTY;
  if (phone.length <= 2) return `${phone[0]}***`;
  if (phone.length <= 5) return `${phone[0]}***${phone[phone.length - 1]}`;
  return `${phone.slice(0, 3)}*****${phone.slice(-2)}`;
}

function initialsFor(name, email) {
  const source = text(name) || text(email).split("@")[0];
  if (!source) return "";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") return EMPTY;
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numeric)) {
    try {
      return formatNGN(numeric);
    } catch {
      return text(value) || EMPTY;
    }
  }
  return text(value) || EMPTY;
}

function formatCount(value) {
  if (value === null || value === undefined || value === "") return EMPTY;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    try {
      return new Intl.NumberFormat("en-US").format(numeric);
    } catch {
      return text(value) || EMPTY;
    }
  }
  return text(value) || EMPTY;
}

function formatGender(value) {
  const gender = text(value);
  if (!gender) return EMPTY;
  return `${gender[0].toUpperCase()}${gender.slice(1)}`;
}

function StudentBadge({ className }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success",
        className,
      )}
    >
      <BadgeCheck aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
      Student
    </span>
  );
}

function InfoRow({ icon: Icon, label, value, title }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
      <Icon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
      />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-sm text-foreground" title={title}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}

export function StudentProfileCard({
  student,
  profile,
  hostel,
  room,
  variant = "compact",
  mask = false,
}) {
  const studentData = student && typeof student === "object" ? student : null;
  const safeProfile = profile && typeof profile === "object" ? profile : null;

  const rawStudentId = text(studentData ? studentData._id : student);
  const studentId = rawStudentId || text(safeProfile?._id);
  const fullName = text(studentData?.fullName) || text(safeProfile?.fullName);
  const email = text(studentData?.email) || text(safeProfile?.email);
  const phone = text(studentData?.phone) || text(safeProfile?.phone);
  const displayName = fullName || "Student";
  const shownStudentId = mask && studentId ? maskPhone(studentId) : studentId;

  const shownEmail = email ? (mask ? maskEmail(email) : email) : EMPTY;
  const shownPhone = phone ? (mask ? maskPhone(phone) : phone) : EMPTY;
  const hostelText = text(hostel);
  const roomText = text(room);
  const location = [hostelText, roomText].filter(Boolean).join(" · ");
  const picture = text(studentData?.profilePicture) || text(safeProfile?.profilePicture);
  const initials = initialsFor(fullName, email);

  const avatar = (
    <Avatar
      className={cn(
        "shrink-0 bg-muted ring-1 ring-border",
        variant === "full" ? "h-14 w-14 text-base" : "h-9 w-9 text-xs",
      )}
    >
      {picture ? (
        <AvatarImage
          src={picture}
          alt={`${displayName}'s profile picture`}
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {initials || <UserRound aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />}
      </AvatarFallback>
    </Avatar>
  );

  if (variant !== "full") {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2.5 shadow-sm">
        {avatar}

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground" title={displayName}>
              {displayName}
            </span>
            <StudentBadge />
          </div>

          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            <span className="truncate" title={shownEmail}>
              <span className="sr-only">Email: </span>
              {shownEmail}
            </span>
          </span>

          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground/80">
            <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            <span className="truncate" title={shownPhone}>
              <span className="sr-only">Phone: </span>
              {shownPhone}
            </span>
          </span>
        </div>

        {location ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground"
            aria-label={`Hostel: ${hostelText}${roomText ? `, room: ${roomText}` : ""}`}
          >
            <MapPin aria-hidden="true" className="h-3 w-3" strokeWidth={1.8} />
            {location}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <section
      aria-label="Student profile"
      className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm sm:rounded-3xl sm:p-5"
    >
      <header className="flex items-start gap-4">
        {avatar}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-foreground">{displayName}</h3>
            <StudentBadge />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={studentId || undefined}>
            <span className="sr-only">Student ID: </span>
            {shownStudentId || EMPTY}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <GraduationCap className="h-5 w-5" strokeWidth={1.8} />
        </span>
      </header>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow icon={Mail} label="Email" value={shownEmail} title={shownEmail} />
        <InfoRow icon={Phone} label="Phone" value={shownPhone} title={shownPhone} />
        <InfoRow icon={UserRound} label="Gender" value={formatGender(safeProfile?.gender)} />
        <InfoRow icon={GraduationCap} label="Hostel" value={hostelText || EMPTY} />
        <InfoRow icon={MapPin} label="Room" value={roomText || EMPTY} />
      </dl>

      {safeProfile ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
          <StatChip icon={Package} label="Orders" value={formatCount(safeProfile.orderCount)} />
          <StatChip icon={Wallet} label="Total paid" value={formatAmount(safeProfile.totalPaid)} />
          <StatChip icon={Wallet} label="Balance" value={formatAmount(safeProfile.balance)} />
        </div>
      ) : null}
    </section>
  );
}

export default StudentProfileCard;
