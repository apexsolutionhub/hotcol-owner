/** Format an ETB amount with thousands separators (no decimals for whole numbers). */
export function formatETB(amount: number | null | undefined): string {
  const n = Number(amount) || 0;
  const hasFraction = Math.abs(n % 1) > 0.001;
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })} ETB`;
}

/** Compact money for tight cards: 12.3k, 1.2M. */
export function formatETBCompact(amount: number | null | undefined): string {
  const n = Number(amount) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ETB`;
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(1)}k ETB`;
  return formatETB(n);
}

export function formatNumber(n: number | null | undefined): string {
  return (Number(n) || 0).toLocaleString("en-US");
}

export function formatDate(value?: string | number | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function roleLabel(role: string): string {
  switch (role) {
    case "Kitchen":
      return "Chef / Kitchen";
    case "Barista":
      return "Bar";
    case "CostControl":
      return "Cost Control";
    case "HotelCashier":
      return "Hotel Cashier";
    case "Reception":
      return "Reception";
    case "CMLeader":
      return "CM Leader";
    case "HR":
      return "HR";
    default:
      return role;
  }
}

export function businessTypeLabel(bt?: string | null): string {
  const v = String(bt || "").trim();
  if (!v) return "Property";
  switch (v) {
    case "Cafe and Restaurant": return "Café & Restaurant";
    case "Hotel": return "Hotel";
    case "Resort": return "Resort";
    case "Pension": return "Pension";
    default: return v;
  }
}

export function isLodgingType(bt?: string | null): boolean {
  const v = String(bt || "").trim();
  return v === "Hotel" || v === "Resort" || v === "Pension";
}

export function businessTypeIcon(bt?: string | null): string {
  const v = String(bt || "").trim();
  switch (v) {
    case "Cafe and Restaurant": return "cafe";
    case "Hotel": return "bed";
    case "Resort": return "umbrella";
    case "Pension": return "home";
    default: return "business";
  }
}

export function approvalStatusLabel(status?: string | null): string {
  const v = String(status || "").trim();
  switch (v) {
    case "PENDING_STORE": return "Pending Store";
    case "PENDING_CC": return "Pending CC";
    case "CHECKED_CC": return "Checked by CC";
    case "PENDING_FINANCE": return "Pending Finance";
    case "PENDING_MANAGER": return "Pending Manager";
    case "AUTHORIZED": return "Authorized";
    case "REJECTED": case "REJECTED_CC": case "REJECTED_FINANCE": case "REJECTED_MANAGER": return "Rejected";
    case "VOID": return "Void";
    default: return v || "—";
  }
}

export function approvalStatusTone(status?: string | null): { fg: string; bg: string } {
  const v = String(status || "").trim();
  if (v === "AUTHORIZED") return { fg: "#4ADE80", bg: "rgba(74, 222, 128, 0.14)" };
  if (v.startsWith("REJECTED") || v === "VOID") return { fg: "#F87171", bg: "rgba(248, 113, 113, 0.14)" };
  if (v === "PENDING_MANAGER") return { fg: "#FBBF24", bg: "rgba(251, 191, 36, 0.14)" };
  return { fg: "#60A5FA", bg: "rgba(96, 165, 250, 0.14)" };
}

export function initials(name?: string | null): string {
  const v = String(name || "").trim();
  if (!v) return "?";
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
