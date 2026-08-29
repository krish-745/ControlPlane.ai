import { i as __toESM } from "../_runtime.mjs";
import { r as fetchInteractions } from "./api-Tx45QOQJ.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as Search, r as WifiOff, s as Download } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.mjs";
import { r as StatusBadge, t as AUDIT_ROWS } from "./status-badge-eOtnX1O1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-Bh7KTwUV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CATEGORIES = [
	"Performance",
	"Cost",
	"Responsibility"
];
function interactionToRow(i) {
	const d2 = i.stage2_decision ?? i.stage1_decision;
	const status = d2 === "BLOCK" ? "block" : d2 === "ESCALATE" ? "escalate" : i.stage1_decision === "BLOCK" ? "block" : "pass";
	const action = status === "block" ? "Blocked" : status === "escalate" ? "Escalated to reviewer" : "Allowed";
	return {
		id: i.id.slice(0, 12),
		ts: i.created_at.slice(0, 19).replace("T", " "),
		useCase: i.use_case,
		category: "Performance",
		action,
		status,
		confidence: .9
	};
}
function AuditPage() {
	const [cat, setCat] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const [liveRows, setLiveRows] = (0, import_react.useState)(null);
	const [backendOnline, setBackendOnline] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchInteractions("demo", 100).then((data) => {
			if (data && data.length > 0) {
				setBackendOnline(true);
				setLiveRows(data.map(interactionToRow));
			} else if (data !== void 0) {
				setBackendOnline(true);
				setLiveRows(null);
			} else {
				setBackendOnline(false);
				setLiveRows(null);
			}
		});
	}, []);
	const staticRows = AUDIT_ROWS.map((r) => ({
		id: r.id,
		ts: r.ts,
		useCase: r.useCase,
		category: r.category,
		action: r.action,
		status: r.status,
		confidence: r.confidence
	}));
	const sourceRows = liveRows ?? staticRows;
	const rows = (0, import_react.useMemo)(() => sourceRows.filter((r) => (cat === "all" || r.category === cat) && (q === "" || `${r.id} ${r.useCase} ${r.action}`.toLowerCase().includes(q.toLowerCase()))), [
		sourceRows,
		cat,
		q
	]);
	function handleExport() {
		const csv = ["timestamp,id,use_case,category,action,confidence", ...rows.map((r) => `"${r.ts}","${r.id}","${r.useCase}","${r.category}","${r.action}",${r.confidence.toFixed(2)}`)].join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "controlplane_audit.csv";
		a.click();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-6 py-6",
		children: [
			backendOnline === false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-600 dark:text-yellow-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "size-3.5" }), "Backend offline — showing static demo data. Start the FastAPI server at port 8000 for live audit rows."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					children: "Audit log"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-0.5 text-sm text-muted-foreground",
					children: [
						rows.length,
						" of ",
						sourceRows.length,
						" decisions · retained 24 months",
						backendOnline && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-pass",
							children: "· live"
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleExport,
					className: "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Export CSV"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: cat,
					onValueChange: setCat,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "h-9 w-[180px] bg-surface text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Category" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "all",
						children: "All categories"
					}), CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: c,
						children: c
					}, c))] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search event id, use case, action",
						className: "h-9 w-[280px] rounded-md border border-border bg-surface pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring/40"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto rounded-lg border border-border bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[900px] text-[13px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border bg-surface-muted text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Timestamp"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Event"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Use case"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Category"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Action taken"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-right font-medium",
									children: "Confidence"
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 last:border-0 hover:bg-secondary/50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular px-3 py-1.5 font-mono text-xs whitespace-nowrap text-muted-foreground",
								children: r.ts
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-1.5 font-mono text-xs text-muted-foreground",
								children: r.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-1.5 whitespace-nowrap",
								children: r.useCase
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-1.5 text-muted-foreground",
								children: r.category
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-1.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 whitespace-nowrap",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: r.action
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular px-3 py-1.5 text-right font-medium",
								children: r.confidence.toFixed(2)
							})
						]
					}, r.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 7,
						className: "px-3 py-10 text-center text-muted-foreground",
						children: "No decisions match these filters."
					}) })] })]
				})
			})
		]
	});
}
//#endregion
export { AuditPage as component };
