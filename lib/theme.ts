/** Navigation theme for react-navigation (dark-only). */
export const NAV_THEME = {
  dark: {
    background: "hsl(222, 47%, 8%)",
    border: "hsl(222, 25%, 21%)",
    card: "hsl(222, 38%, 13%)",
    notification: "hsl(0, 91%, 71%)",
    primary: "hsl(172, 66%, 50%)",
    text: "hsl(213, 32%, 95%)",
  },
};

/** Design tokens for the HotCol Owner app (dark theme). */

export const C = {
  bg: "#0B1120",
  card: "#141C2E",
  cardAlt: "#1A2438",
  border: "#253044",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  textFaint: "#64748B",

  primary: "#2DD4BF",
  primaryDark: "#5EEAD4",
  primarySoft: "rgba(45, 212, 191, 0.14)",

  accent: "#FBBF24",
  accentSoft: "rgba(251, 191, 36, 0.14)",

  danger: "#F87171",
  dangerSoft: "rgba(248, 113, 113, 0.14)",
  warning: "#FBBF24",
  warningSoft: "rgba(251, 191, 36, 0.14)",
  success: "#4ADE80",
  successSoft: "rgba(74, 222, 128, 0.14)",
  info: "#60A5FA",
  infoSoft: "rgba(96, 165, 250, 0.14)",

  white: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

type Tone = {
  fg: string;
  bg: string;
};

/** Map subscription / account status codes to a label + color tone. */
export function statusTone(status: string): Tone & { label: string } {
  switch (status) {
    case "active":
    case "exempt":
      return { label: status === "exempt" ? "Exempt" : "Active", fg: C.success, bg: C.successSoft };
    case "trial":
      return { label: "Trial", fg: C.info, bg: C.infoSoft };
    case "trial_ending":
      return { label: "Trial ending", fg: C.warning, bg: C.warningSoft };
    case "trial_expired":
      return { label: "Trial expired", fg: C.danger, bg: C.dangerSoft };
    case "warning":
      return { label: "Renew soon", fg: C.warning, bg: C.warningSoft };
    case "on_hold":
      return { label: "On hold", fg: C.textMuted, bg: C.cardAlt };
    case "setup_pending":
      return { label: "Setup pending", fg: C.warning, bg: C.warningSoft };
    case "pending":
    case "pending_approval":
      return { label: "Pending approval", fg: C.warning, bg: C.warningSoft };
    case "grace":
      return { label: "Grace period", fg: C.warning, bg: C.warningSoft };
    case "expired":
      return { label: "Expired", fg: C.danger, bg: C.dangerSoft };
    case "suspended":
      return { label: "Suspended", fg: C.danger, bg: C.dangerSoft };
    case "banned":
      return { label: "Banned", fg: C.danger, bg: C.dangerSoft };
    default:
      return { label: status || "—", fg: C.textMuted, bg: C.cardAlt };
  }
}
