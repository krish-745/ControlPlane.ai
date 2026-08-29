import { i as __toESM } from "../_runtime.mjs";
import { a as fetchTrustMetrics } from "./api-Tx45QOQJ.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { l as CircleX, p as ChevronDown, u as CircleCheck } from "../_libs/lucide-react.mjs";
import { a as CartesianGrid, i as Line, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as LineChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trust-CgIbZtve.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Gauge({ label, value }) {
	const r = 34;
	const c = 2 * Math.PI * r;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative size-24",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 80 80",
				className: "size-full -rotate-90",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "40",
					cy: "40",
					r,
					className: "fill-none stroke-secondary",
					strokeWidth: "7"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "40",
					cy: "40",
					r,
					className: "fill-none stroke-primary",
					strokeWidth: "7",
					strokeLinecap: "round",
					strokeDasharray: c,
					strokeDashoffset: c * (1 - value)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "tabular absolute inset-0 flex items-center justify-center text-base font-semibold",
				children: [(value * 100).toFixed(0), "%"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-medium text-muted-foreground",
			children: label
		})]
	});
}
function TrustPage() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [metrics, setMetrics] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchTrustMetrics().then((res) => {
			if (res) setMetrics(res);
		});
	}, []);
	if (!metrics) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-6 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-xl font-semibold",
			children: "Trust & metrics"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted-foreground animate-pulse",
			children: "Loading live metrics..."
		})]
	});
	const { fpr, total_flags, escalated, trend, categories, golden } = metrics;
	const passed = golden.passed;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-semibold",
				children: "Trust & metrics"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Detection quality across the last 30 days, measured against labelled ground truth."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-3",
				children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-border bg-surface p-5 shadow-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: c.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex justify-between",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
								label: "Precision",
								value: c.precision
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
								label: "Recall",
								value: c.recall
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
								label: "F1 score",
								value: c.f1
							})
						]
					})]
				}, c.name))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "Flags per 100 requests"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Last 7 days, all use cases."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 h-56",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
								width: "100%",
								height: "100%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
									data: trend,
									margin: {
										top: 8,
										right: 8,
										bottom: 0,
										left: -20
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
											strokeDasharray: "3 3",
											stroke: "var(--border)",
											vertical: false
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
											dataKey: "day",
											tickLine: false,
											axisLine: false,
											tick: {
												fontSize: 11,
												fill: "var(--muted-foreground)"
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
											tickLine: false,
											axisLine: false,
											tick: {
												fontSize: 11,
												fill: "var(--muted-foreground)"
											},
											domain: [0, 10]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
											borderRadius: 10,
											border: "1px solid var(--border)",
											background: "var(--popover)",
											color: "var(--popover-foreground)",
											fontSize: 12
										} }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
											type: "monotone",
											dataKey: "flags",
											stroke: "var(--primary)",
											strokeWidth: 2,
											dot: {
												r: 3,
												fill: "var(--primary)"
											},
											activeDot: { r: 5 }
										})
									]
								})
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col justify-center rounded-xl border border-border bg-surface p-6 shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-wide text-muted-foreground uppercase",
							children: "False positive rate"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "tabular mt-3 text-6xl font-semibold tracking-tight",
							children: [fpr, "%"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted-foreground",
							children: [
								"Calculated from ",
								escalated,
								" escalated interactions requiring human review."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 h-1.5 overflow-hidden rounded-full bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-pass",
								style: { width: `${Math.min(100, Math.max(0, fpr * 10))}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted-foreground",
							children: "Target ceiling: 10%"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-xl border border-border bg-surface p-6 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-wide text-muted-foreground uppercase",
							children: "Golden test accuracy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "tabular mt-2 text-4xl font-semibold tracking-tight",
							children: [
								Math.round(passed / golden.total * 100),
								"%",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-2xl font-medium text-muted-foreground",
									children: [
										"(",
										passed,
										"/",
										golden.total,
										")"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: ["last run ", golden.date]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setOpen((o) => !o),
						className: "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
						"aria-expanded": open,
						children: [
							open ? "Hide" : "View",
							" test cases",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 transition-transform", open && "rotate-180") })
						]
					})]
				}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-5 divide-y divide-border rounded-lg border border-border",
					children: golden.results.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 px-4 py-2.5 text-sm",
						children: [
							g.pass ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 shrink-0 text-pass" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-4 shrink-0 text-block" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: g.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto text-xs text-muted-foreground",
								children: g.cat
							})
						]
					}, g.name))
				})]
			})
		]
	});
}
//#endregion
export { TrustPage as component };
