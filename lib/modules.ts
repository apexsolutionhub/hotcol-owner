/** Subscribed HotCol modules — keep labels in sync with hotcol-user. */

export const MODULES = {
  credentials: "Credentials(Common)",
  cafe: "Cafe and Restaurant",
  inventory: "Inventory",
  credit: "Credit Management",
  finance: "Financial Management",
  rooms: "Room Management",
  cm: "Cleaning and Maintenance",
  hr: "HR Module",
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

/** Full catalog order — keep in sync with hotcol-user MODULE_OPTIONS. */
export const MODULE_OPTIONS = [
  MODULES.credentials,
  MODULES.cafe,
  MODULES.inventory,
  MODULES.credit,
  MODULES.finance,
  MODULES.hr,
  MODULES.rooms,
  MODULES.cm,
] as const satisfies readonly ModuleName[];

const COMING_SOON_MODULES = new Set<string>([]);

const LABELS: Record<string, string> = {
  [MODULES.credentials]: "Staff access",
  [MODULES.cafe]: "Café & F&B",
  [MODULES.inventory]: "Inventory",
  [MODULES.credit]: "Credit",
  [MODULES.finance]: "Finance",
  [MODULES.rooms]: "Rooms",
  [MODULES.cm]: "Housekeeping",
  [MODULES.hr]: "HR",
};

const DESCRIPTIONS: Record<string, string> = {
  [MODULES.credentials]: "Staff login credentials for this property.",
  [MODULES.cafe]: "Orders, kitchen, bar, tables, and café operations.",
  [MODULES.inventory]: "Store, stock, suppliers, and item receipts.",
  [MODULES.credit]: "Corporate credit registration and usage.",
  [MODULES.finance]: "Cost control and finance approval workflows.",
  [MODULES.hr]: "Employees, leave, attendance, documents, and payroll.",
  [MODULES.rooms]: "Rooms, reception, guest stays, and lodging billing.",
  [MODULES.cm]: "Housekeeping and maintenance queues.",
};

export function moduleDescription(name: string): string {
  return DESCRIPTIONS[name] ?? "";
}

/**
 * Modules that cannot be newly requested for this business type
 * (required, coming soon, or not applicable). Mirrors hotcol-user signup rules.
 */
export function isModuleDisabledForBusinessType(
  mod: string,
  businessType: string | null | undefined,
): boolean {
  if (COMING_SOON_MODULES.has(mod)) return true;
  if (mod === MODULES.credentials) return true;
  const bt = String(businessType || "").trim();
  if (bt === "Cafe and Restaurant") {
    if (mod === MODULES.cafe) return true;
    if (mod === MODULES.finance) return true;
    if (mod === MODULES.rooms || mod === MODULES.cm) return true;
  }
  return false;
}

/** Modules the owner can request to add (not already subscribed, allowed for type). */
export function requestableModules(
  current: string[] | null | undefined,
  businessType: string | null | undefined,
): ModuleName[] {
  const owned = new Set(Array.isArray(current) ? current : []);
  return MODULE_OPTIONS.filter((mod) => {
    if (mod === MODULES.credentials) return false;
    if (owned.has(mod)) return false;
    return !isModuleDisabledForBusinessType(mod, businessType);
  });
}

/** Subscribed modules that can be requested for removal. */
export function removableModules(current: string[] | null | undefined): string[] {
  return (Array.isArray(current) ? current : []).filter(
    (mod) => mod !== MODULES.credentials,
  );
}

export function parseModules(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((m) => String(m).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((m) => String(m).trim()).filter(Boolean);
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

export function hasModule(
  modules: string[] | null | undefined,
  name: string,
): boolean {
  return Array.isArray(modules) && modules.includes(name);
}

export function moduleLabel(name: string): string {
  return LABELS[name] ?? name;
}

/** Owner-facing capability flags derived from subscribed modules. */
export function propertyCapabilities(modules: string[] | null | undefined) {
  const list = Array.isArray(modules) ? modules : [];
  return {
    hasCafe: list.includes(MODULES.cafe),
    hasInventory: list.includes(MODULES.inventory),
    hasFinance: list.includes(MODULES.finance),
    hasCredit: list.includes(MODULES.credit),
    hasRooms: list.includes(MODULES.rooms),
    hasCm: list.includes(MODULES.cm),
    hasHr: list.includes(MODULES.hr),
    hasCredentials:
      list.includes(MODULES.credentials) || list.includes("Credentials"),
    /** Purchase / stock approval pipelines */
    hasApprovals:
      list.includes(MODULES.inventory) || list.includes(MODULES.finance),
    /**
     * Inventory-centric properties (e.g. hotel store without café/rooms):
     * show department leaders + cost-controller IDs on Staff.
     */
    isInventoryFocused:
      list.includes(MODULES.inventory) &&
      !list.includes(MODULES.cafe) &&
      !list.includes(MODULES.rooms) &&
      !list.includes(MODULES.cm),
  };
}

/** Short chips for property cards (skip credentials — always-on). */
export function moduleChips(modules: string[] | null | undefined): string[] {
  const caps = propertyCapabilities(modules);
  const chips: string[] = [];
  if (caps.hasRooms) chips.push(moduleLabel(MODULES.rooms));
  if (caps.hasCm) chips.push(moduleLabel(MODULES.cm));
  if (caps.hasCafe) chips.push(moduleLabel(MODULES.cafe));
  if (caps.hasInventory) chips.push(moduleLabel(MODULES.inventory));
  if (caps.hasFinance) chips.push(moduleLabel(MODULES.finance));
  if (caps.hasCredit) chips.push(moduleLabel(MODULES.credit));
  if (caps.hasHr) chips.push(moduleLabel(MODULES.hr));
  return chips;
}
