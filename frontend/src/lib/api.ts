/**
 * api.ts - Typed client for the ControlPlane.ai FastAPI backend.
 *
 * Base URL is resolved from VITE_API_URL (set in .env.example).
 * In development the Vite proxy rewrites /api -> http://localhost:8000,
 * so no hardcoded localhost appears in production bundles.
 *
 * Every function returns undefined on network/parse errors so that
 * callers can gracefully fall back to local mock data.
 */

const BASE: string =
  typeof window === "undefined"
    ? "http://20.6.130.181:8000/api"
    : "/api";

async function get<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T | undefined> {
  try {
    const base = typeof window !== "undefined" ? window.location.href : BASE;
    const url = new URL(`${BASE}${path}`, base);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

async function post<T>(path: string, body: unknown): Promise<T | undefined> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

// ---- Types matching FastAPI response shapes --------------------------------

export type ApiInteraction = {
  id: string;
  use_case: string;
  agent_id: string | null;
  stage1_decision: "ALLOW" | "BLOCK";
  stage1_latency_ms: number | null;
  stage2_decision: "ALLOW" | "ESCALATE" | "BLOCK" | null;
  stage2_latency_ms: number | null;
  llm_backend: string;
  created_at: string;
};

export type ApiFlag = {
  id: string;
  interaction_id: string;
  stage: 1 | 2;
  categories: string[];
  reason: string;
  confidence: number;
  action_taken: string;
  span: string | null;
  created_at: string;
};

export type ApiPolicy = {
  id?: string;
  org_id: string;
  use_case: string;
  jurisdiction?: string | null;
  latency_budget_ms?: number;
  checks_enabled?: Record<string, boolean>;
  thresholds?: {
    grounding_similarity_min?: number;
    loop_count_max?: number;
    [key: string]: unknown;
  };
};

export type ApiHealth = {
  status: "ok" | string;
  backend: string;
};

export type TrustMetrics = {
  fpr: number;
  total_flags: number;
  escalated: number;
  trend: { day: string; flags: number }[];
  categories: { name: string; precision: number; recall: number; f1: number }[];
  golden: {
    results: { name: string; pass: boolean; cat: string; info: string }[];
    passed: number;
    total: number;
    date: string;
  };
};

// ---- Endpoint functions ----------------------------------------------------

/** Fetch trust and metric data from backend. */
export function fetchTrustMetrics(): Promise<TrustMetrics | undefined> {
  return get<TrustMetrics>("/v1/trust/metrics");
}

/** Fetch the live flag feed for an org (latest first). */
export function fetchFlags(
  org_id = "demo",
  limit = 50,
): Promise<ApiFlag[] | undefined> {
  return get<ApiFlag[]>("/v1/flags", { org_id, limit });
}

/** Fetch the interaction / audit log for an org (latest first). */
export function fetchInteractions(
  org_id = "demo",
  limit = 100,
): Promise<ApiInteraction[] | undefined> {
  return get<ApiInteraction[]>("/v1/interactions", { org_id, limit });
}

/** Fetch the active policy profile for an org + use case. */
export function fetchPolicy(
  org_id: string,
  use_case: string,
): Promise<ApiPolicy | undefined> {
  return get<ApiPolicy>(
    `/policy/config/${encodeURIComponent(org_id)}/${encodeURIComponent(use_case)}`,
  );
}

/** Persist updated policy configuration. */
export function updatePolicy(
  payload: Partial<ApiPolicy> & { org_id: string; use_case: string }
): Promise<{ id: string; org_id: string; use_case: string } | undefined> {
  return post("/policy/config", payload);
}

/** Probe the backend health endpoint. */
export function fetchHealth(): Promise<ApiHealth | undefined> {
  return get<ApiHealth>("/health");
}

/** Submit a human review status for an interaction. */
export function submitReview(
  interaction_id: string,
  status: string,
): Promise<{ status: string } | undefined> {
  return post(`/v1/interactions/${encodeURIComponent(interaction_id)}/review`, { status });
}
