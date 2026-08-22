import Constants from "expo-constants";

export const OWNER_VERCEL_GRAPHQL_URL =
  "https://hotcol-owner-backend.vercel.app/graphql";

function normalizeGraphqlHttpUrl(raw: string): string {
  const base = raw.trim().replace(/\/+$/, "");
  if (/\/graphql$/i.test(base)) return base;
  return `${base}/graphql`;
}

/**
 * Resolve the owner GraphQL endpoint.
 *
 * Priority:
 *   1. EXPO_PUBLIC_API_URL (Vercel in .env / EAS, or localhost for local API)
 *   2. Production default: hotcol-owner-backend on Vercel
 *   3. Dev-only LAN host from Expo (physical device → local :4001)
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim()) return normalizeGraphqlHttpUrl(fromEnv);

  if (!__DEV__) return OWNER_VERCEL_GRAPHQL_URL;

  const hostUri = Constants.expoConfig?.hostUri ?? "";
  if (hostUri) {
    const host = String(hostUri).split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:4001/graphql`;
    }
  }

  return OWNER_VERCEL_GRAPHQL_URL;
}

export const API_URL = resolveApiUrl();

export const OWNER_TOKEN_KEY = "hotcol_owner_token";
export const SELECTED_TIN_KEY = "hotcol_owner_selected_tin";
export const HOTCOL_CBE_ACCOUNT = "1000418779358";
