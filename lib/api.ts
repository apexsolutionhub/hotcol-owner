import { API_URL } from "@/constants/config";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Register a callback fired when the server reports an expired/invalid session. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const SESSION_DEAD = ["session expired", "not authenticated", "jwt expired"];

export async function gql<T = any>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ query, variables: variables ?? {} }),
    });
  } catch {
    throw new ApiError(
      `Could not reach the owner API at ${API_URL}. Confirm hotcol-owner-backend is deployed on Vercel, or set EXPO_PUBLIC_API_URL for a local server.`,
    );
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("Unexpected server response.");
  }

  if (json?.errors?.length) {
    const message = String(json.errors[0]?.message || "Request failed");
    if (SESSION_DEAD.some((m) => message.toLowerCase().includes(m))) {
      onUnauthorized?.();
    }
    if (/pool timeout|failed to retrieve a connection/i.test(message)) {
      throw new ApiError(
        "Owner API could not open a database connection. Redeploy hotcol-owner-backend and try again.",
      );
    }
    throw new ApiError(message);
  }

  return json.data as T;
}
