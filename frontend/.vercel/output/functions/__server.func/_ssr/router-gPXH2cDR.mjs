import { i as __toESM } from "../_runtime.mjs";
import { n as fetchHealth } from "./api-Tx45QOQJ.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as WifiOff } from "../_libs/lucide-react.mjs";
import { c as HeadContent, d as Outlet, f as lazyRouteComponent, g as useRouter, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-gPXH2cDR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BmwX-X8I.css";
var TABS = [
	{
		to: "/",
		label: "Monitor"
	},
	{
		to: "/policy",
		label: "Policy"
	},
	{
		to: "/trust",
		label: "Trust"
	},
	{
		to: "/audit",
		label: "Audit"
	}
];
function TopNav() {
	const [health, setHealth] = (0, import_react.useState)("unknown");
	const [backend, setBackend] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		async function check() {
			const data = await fetchHealth();
			if (data) {
				setHealth(data.status === "ok" ? "ok" : "offline");
				setBackend(data.backend ?? "");
			} else setHealth("offline");
		}
		check();
		const t = setInterval(check, 1e4);
		return () => clearInterval(t);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-14 max-w-[1400px] items-center gap-8 px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/favicon.jpg",
						alt: "Logo",
						className: "size-7 rounded-md object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[15px] font-semibold tracking-tight",
						children: "ControlPlane.ai"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex h-full items-stretch gap-1",
					children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: t.to,
						activeOptions: { exact: t.to === "/" },
						className: "relative flex items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
						activeProps: { className: "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" },
						children: t.label
					}, t.to))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ml-auto flex items-center gap-3 text-xs text-muted-foreground",
					children: health === "ok" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full border border-pass/25 bg-pass-soft px-2.5 py-1 font-medium text-pass-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-pulse rounded-full bg-pass" }),
							"Gateway Healthy",
							backend && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "hidden sm:inline opacity-70 capitalize",
								children: ["· ", backend]
							})
						]
					}) : health === "offline" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full border border-block/25 bg-block-soft px-2.5 py-1 font-medium text-block-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "size-3" }), "Backend offline"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 font-medium text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-muted-foreground opacity-50" }), "Connecting…"]
					})
				})
			]
		})
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$4 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "ControlPlane.ai" },
			{
				name: "description",
				content: "ControlPlane inspects every AI response for grounding, cost and safety before it reaches your users."
			},
			{
				property: "og:title",
				content: "ControlPlane — Real-time AI Oversight"
			},
			{
				property: "og:description",
				content: "Enterprise oversight for AI responses: performance, cost and responsibility."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.jpg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$4.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-screen bg-background",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopNav, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})]
		})
	});
}
var $$splitComponentImporter$3 = () => import("./routes-Ci3z-Awy.mjs");
var Route$3 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "ControlPlane.ai" },
		{
			name: "description",
			content: "Live feed of AI responses checked for grounding, cost and safety before they reach your users."
		},
		{
			property: "og:title",
			content: "Monitor — ControlPlane AI Oversight"
		},
		{
			property: "og:description",
			content: "Real-time inspection of every AI response passing through your applications."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./audit-Bh7KTwUV.mjs");
var Route$2 = createFileRoute("/audit")({
	head: () => ({ meta: [
		{ title: "Audit Log — ControlPlane" },
		{
			name: "description",
			content: "Filterable record of every oversight decision: organization, use case, category, action and confidence."
		},
		{
			property: "og:title",
			content: "Audit Log — ControlPlane"
		},
		{
			property: "og:description",
			content: "A dense, exportable trail of every AI oversight decision."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./policy-BD5HHXaC.mjs");
var Route$1 = createFileRoute("/policy")({
	head: () => ({ meta: [
		{ title: "Policy Configuration — ControlPlane" },
		{
			name: "description",
			content: "Tune latency budgets, active checks and jurisdiction rules per use case."
		},
		{
			property: "og:title",
			content: "Policy Configuration — ControlPlane"
		},
		{
			property: "og:description",
			content: "Readable, auditable AI guardrail policies — no JSON required."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./trust-CgIbZtve.mjs");
var Route = createFileRoute("/trust")({
	head: () => ({ meta: [
		{ title: "Trust & Metrics — ControlPlane" },
		{
			name: "description",
			content: "Precision, recall and F1 by oversight category, false positive rate and golden test accuracy."
		},
		{
			property: "og:title",
			content: "Trust & Metrics — ControlPlane"
		},
		{
			property: "og:description",
			content: "Stakeholder-facing evidence that AI oversight is accurate and measurable."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	AuditRoute: Route$2.update({
		id: "/audit",
		path: "/audit",
		getParentRoute: () => Route$4
	}),
	PolicyRoute: Route$1.update({
		id: "/policy",
		path: "/policy",
		getParentRoute: () => Route$4
	}),
	TrustRoute: Route.update({
		id: "/trust",
		path: "/trust",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
