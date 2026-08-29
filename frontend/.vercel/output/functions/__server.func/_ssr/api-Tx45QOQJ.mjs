//#region node_modules/.nitro/vite/services/ssr/assets/api-Tx45QOQJ.js
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
var BASE = typeof import.meta !== "undefined" && {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/"
}["VITE_API_URL"] || "/api";
async function get(path, params) {
	try {
		const url = new URL(`${BASE}${path}`, window.location.href);
		if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
		const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15e3) });
		if (!res.ok) return void 0;
		return await res.json();
	} catch {
		return;
	}
}
async function post(path, body) {
	try {
		const res = await fetch(`${BASE}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(5e3)
		});
		if (!res.ok) return void 0;
		return await res.json();
	} catch {
		return;
	}
}
/** Fetch trust and metric data from backend. */
function fetchTrustMetrics() {
	return get("/v1/trust/metrics");
}
/** Fetch the live flag feed for an org (latest first). */
function fetchFlags(org_id = "demo", limit = 50) {
	return get("/v1/flags", {
		org_id,
		limit
	});
}
/** Fetch the interaction / audit log for an org (latest first). */
function fetchInteractions(org_id = "demo", limit = 100) {
	return get("/v1/interactions", {
		org_id,
		limit
	});
}
/** Fetch the active policy profile for an org + use case. */
function fetchPolicy(org_id, use_case) {
	return get(`/policy/config/${encodeURIComponent(org_id)}/${encodeURIComponent(use_case)}`);
}
/** Persist updated policy configuration. */
function updatePolicy(payload) {
	return post("/policy/config", payload);
}
/** Probe the backend health endpoint. */
function fetchHealth() {
	return get("/health");
}
/** Submit a human review status for an interaction. */
function submitReview(interaction_id, status) {
	return post(`/v1/interactions/${encodeURIComponent(interaction_id)}/review`, { status });
}
//#endregion
export { fetchTrustMetrics as a, fetchPolicy as i, fetchHealth as n, submitReview as o, fetchInteractions as r, updatePolicy as s, fetchFlags as t };
