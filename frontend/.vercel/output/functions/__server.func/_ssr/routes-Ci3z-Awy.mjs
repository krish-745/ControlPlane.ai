import { i as __toESM } from "../_runtime.mjs";
import { o as submitReview, r as fetchInteractions, t as fetchFlags } from "./api-Tx45QOQJ.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { f as ChevronRight, n as X, o as Info, r as WifiOff, t as Zap } from "../_libs/lucide-react.mjs";
import { a as makeEvent, n as CategoryPill, o as seedEvents, r as StatusBadge } from "./status-badge-eOtnX1O1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Ci3z-Awy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var HIGHLIGHT = {
	pass: "bg-pass-soft decoration-pass",
	patch: "bg-patch-soft decoration-patch",
	escalate: "bg-escalate-soft decoration-escalate",
	block: "bg-block-soft decoration-block"
};
function formatUseCase(uc) {
	return uc.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function buildLatencyMap(interactions) {
	const map = /* @__PURE__ */ new Map();
	for (const ix of interactions) map.set(ix.id, {
		stage1: ix.stage1_latency_ms ?? 0,
		stage2: ix.stage2_latency_ms ?? 0,
		use_case: ix.use_case
	});
	return map;
}
function avgLatency(interactions, n = 20) {
	const recent = interactions.slice(0, n);
	if (recent.length === 0) return {
		stage1: 0,
		stage2: 0
	};
	const s1 = recent.filter((ix) => ix.stage1_latency_ms != null);
	const s2 = recent.filter((ix) => ix.stage2_latency_ms != null);
	return {
		stage1: s1.length > 0 ? s1.reduce((a, ix) => a + (ix.stage1_latency_ms ?? 0), 0) / s1.length : 0,
		stage2: s2.length > 0 ? s2.reduce((a, ix) => a + (ix.stage2_latency_ms ?? 0), 0) / s2.length : 0
	};
}
function flagsToEvent(flags, latencyMap) {
	const f = flags[0];
	const actions = flags.map((fl) => fl.action_taken.toLowerCase());
	const status = actions.includes("block") ? "block" : actions.includes("escalate") ? "escalate" : actions.includes("allow") ? "pass" : "patch";
	const catSet = /* @__PURE__ */ new Set();
	for (const fl of flags) for (const c of fl.categories) {
		const lc = c.toLowerCase();
		if (lc === "performance") catSet.add("Performance");
		if (lc === "cost") catSet.add("Cost");
		if (lc === "responsibility") catSet.add("Responsibility");
	}
	const categories = Array.from(catSet);
	const ts = f.created_at ? new Date(f.created_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" }) : "--:--:--";
	const interaction = latencyMap.get(f.interaction_id);
	const latency = interaction ?? {
		stage1: 0,
		stage2: 0
	};
	const reason = flags.length > 1 ? "Multiple violations:\n" + flags.map((fl) => `• ${fl.reason}`).join("\n") : f.reason;
	const combinedSpans = flags.map((fl) => fl.span).filter(Boolean).join(" ... ");
	const confidence = Math.max(...flags.map((fl) => fl.confidence ?? 0));
	return {
		id: f.interaction_id,
		ts,
		useCase: interaction?.use_case ?? f.interaction_id,
		status,
		categories,
		response: combinedSpans || "(no span recorded)",
		flagged: combinedSpans,
		reason,
		stage1: latency.stage1,
		stage2: latency.stage2,
		confidence,
		humanReview: f.human_review
	};
}
function LatencyStrip({ stage1, stage2 }) {
	const s1Display = stage1 > 0 ? stage1 < 1 ? "<1ms" : `${Math.round(stage1)}ms` : "—";
	const s2Display = stage2 > 0 ? stage2 < 1 ? "<1ms" : `${Math.round(stage2)}ms` : "—";
	const isLive = stage1 > 0 || stage2 > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-b border-border bg-surface-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-2 text-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1.5 font-medium text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-3.5 text-primary" }), "Inline inspection"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted-foreground",
					children: [
						"Stage 1 checks:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("tabular font-semibold", isLive ? "text-foreground" : "text-muted-foreground"),
							children: s1Display
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3 w-px bg-border" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted-foreground",
					children: [
						"Stage 2 checks:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("tabular font-semibold", isLive ? "text-foreground" : "text-muted-foreground"),
							children: s2Display
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto text-muted-foreground",
					children: isLive ? "Rolling Average · Last 20 Requests" : "p99 budget 400ms"
				})
			]
		})
	});
}
function MonitorPage() {
	const [events, setEvents] = (0, import_react.useState)(() => seedEvents());
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [backendOnline, setBackendOnline] = (0, import_react.useState)(null);
	const [avgLatencies, setAvgLatencies] = (0, import_react.useState)({
		stage1: 0,
		stage2: 0
	});
	(0, import_react.useEffect)(() => {
		let mockCounter = 12;
		async function poll() {
			const [liveFlags, liveInteractions] = await Promise.all([fetchFlags("demo", 40), fetchInteractions("demo", 40)]);
			if (liveFlags && liveFlags.length > 0) {
				setBackendOnline(true);
				const latencyMap = buildLatencyMap(liveInteractions ?? []);
				const flagsByIx = /* @__PURE__ */ new Map();
				for (const f of liveFlags) {
					const group = flagsByIx.get(f.interaction_id) ?? [];
					group.push(f);
					flagsByIx.set(f.interaction_id, group);
				}
				const liveEvents = Array.from(flagsByIx.values()).map((group) => flagsToEvent(group, latencyMap));
				setEvents(liveEvents);
				if (liveInteractions && liveInteractions.length > 0) setAvgLatencies(avgLatency(liveInteractions));
			} else if (liveFlags !== void 0) {
				setBackendOnline(true);
				mockCounter += 1;
				const at = new Date(Date.now() - Math.floor(Math.random() * 800));
				setEvents((prev) => [makeEvent(mockCounter, at), ...prev].slice(0, 15));
			} else {
				setBackendOnline(false);
				mockCounter += 1;
				const at = new Date(Date.now() - Math.floor(Math.random() * 1500));
				setEvents((prev) => [makeEvent(mockCounter, at), ...prev].slice(0, 15));
			}
		}
		poll();
		const t = setInterval(poll, 3800);
		return () => clearInterval(t);
	}, []);
	const shown = (0, import_react.useMemo)(() => filter === "all" ? events : events.filter((e) => e.status === filter), [events, filter]);
	const selected = events.find((e) => e.id === selectedId) ?? null;
	const counts = (0, import_react.useMemo)(() => {
		const c = {
			pass: 0,
			patch: 0,
			escalate: 0,
			block: 0
		};
		for (const e of events) c[e.status] += 1;
		return c;
	}, [events]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-[calc(100vh-3.5rem)] flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LatencyStrip, {
				stage1: avgLatencies.stage1,
				stage2: avgLatencies.stage2
			}),
			backendOnline === false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 border-b border-yellow-500/30 bg-yellow-500/10 px-6 py-2 text-xs text-yellow-600 dark:text-yellow-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "size-3.5" }), "Backend offline — showing demo data. Start the FastAPI server at port 8000 to see live events."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-6 py-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("min-w-0 flex-1", selected && "hidden xl:block"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-5 flex flex-wrap items-end justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl font-semibold",
							children: "Live monitor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: backendOnline ? "Showing live flags from the backend. Select a row to review the verdict." : "Every model response inspected in flight. Select a row to review the verdict."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-1 rounded-lg border border-border bg-surface p-1",
							children: [
								"all",
								"pass",
								"patch",
								"escalate",
								"block"
							].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setFilter(f),
								className: cn("rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors", filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"),
								children: [f, f !== "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular ml-1.5 text-muted-foreground",
									children: counts[f]
								})]
							}, f))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-hidden rounded-xl border border-border bg-surface shadow-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border bg-surface-muted text-left text-xs font-medium tracking-wide text-muted-foreground uppercase",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-2.5 font-medium",
										children: "Time"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-2.5 font-medium",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5",
											children: ["Use case", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												title: "The specific AI application or policy profile governing this request.",
												className: "flex",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-3.5 text-muted-foreground/70 cursor-help" })
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "hidden px-4 py-2.5 font-medium lg:table-cell",
										children: "Flags"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-2.5 font-medium",
										children: "Status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-2.5 font-medium",
										children: "Confidence"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "w-8" })
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: shown.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								onClick: () => setSelectedId(e.id),
								className: cn("cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/60", selectedId === e.id && "bg-accent/60"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "tabular px-4 py-3 font-mono text-xs text-muted-foreground",
										children: e.ts
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 font-medium",
										children: formatUseCase(e.useCase)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "hidden px-4 py-3 lg:table-cell",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-wrap gap-1",
											children: e.categories.length ? e.categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryPill, { label: c }, c)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: "—"
											})
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: e.status })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "tabular px-4 py-3 text-muted-foreground",
										children: e.confidence.toFixed(2)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 text-muted-foreground",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
									})
								]
							}, e.id)) })]
						})
					})]
				}), selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailPanel, {
					event: selected,
					onClose: () => setSelectedId(null)
				}, selected.id)]
			})
		]
	});
}
function DetailPanel({ event, onClose }) {
	const parts = event.flagged ? event.response.split(event.flagged) : [event.response];
	const [reviewState, setReviewState] = (0, import_react.useState)(event.humanReview ?? null);
	async function handleReview(status) {
		setReviewState(status);
		event.humanReview = status;
		await submitReview(event.id, status);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: "w-full shrink-0 xl:w-[420px]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sticky top-20 rounded-xl border border-border bg-surface p-5 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-muted-foreground uppercase",
							children: "Response review"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-base font-semibold",
							children: formatUseCase(event.useCase)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "tabular mt-0.5 font-mono text-xs text-muted-foreground",
							children: event.ts
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
						"aria-label": "Close panel",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: event.status }), event.categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryPill, { label: c }, c))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 rounded-lg border border-border bg-surface-muted p-4 text-sm leading-relaxed",
					children: parts.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [p, i < parts.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("mark", {
						className: cn("rounded px-0.5 text-foreground underline decoration-2 underline-offset-4", HIGHLIGHT[event.status]),
						children: event.flagged
					})] }, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-4 space-y-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs tracking-wide text-muted-foreground uppercase",
						children: "Why"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 text-muted-foreground",
						children: event.reason
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-3 border-t border-border pt-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Stage 1",
								value: event.stage1 > 0 ? event.stage1 < 1 ? "<1ms" : `${Math.round(event.stage1)}ms` : "—",
								live: event.stage1 > 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Stage 2",
								value: event.stage2 > 0 ? event.stage2 < 1 ? "<1ms" : `${Math.round(event.stage2)}ms` : "—",
								live: event.stage2 > 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Confidence",
								value: event.confidence.toFixed(2)
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 border-t border-border pt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-xs tracking-wide text-muted-foreground uppercase",
						children: "Human Review"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: event.status === "pass" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => handleReview("MISSED_VIOLATION"),
							disabled: reviewState !== null,
							className: "rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-50",
							children: reviewState === "MISSED_VIOLATION" ? "Marked as Missed" : "Flag Missed Violation"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => handleReview("OVERTURNED"),
							disabled: reviewState !== null,
							className: "rounded border border-border bg-block/10 px-3 py-1.5 text-xs font-medium text-block transition-colors hover:bg-block/20 disabled:opacity-50",
							children: reviewState === "OVERTURNED" ? "Overturned" : "Overturn (False Positive)"
						})
					})]
				})
			]
		})
	});
}
function Metric({ label, value, live = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("tabular mt-0.5 text-sm font-semibold", live && "text-primary"),
		children: value
	})] });
}
//#endregion
export { MonitorPage as component };
