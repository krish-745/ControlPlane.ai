import { i as __toESM } from "../_runtime.mjs";
import { i as fetchPolicy, s as updatePolicy } from "./api-Tx45QOQJ.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Save, c as Columns2, n as X, r as WifiOff } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.mjs";
import { i as USE_CASES, n as CategoryPill, r as StatusBadge } from "./status-badge-eOtnX1O1.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/radix-ui__react-slider.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/policy-BD5HHXaC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = Slider$1.displayName;
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
var USE_CASE_KEYS = {
	"Customer Support Bot": "customer_support_bot",
	"Internal Knowledge Assistant": "internal_knowledge_assistant",
	"Decision Support Tool": "decision_support_batch"
};
var CHECKS = [
	{
		key: "pii",
		name: "PII detection",
		desc: "Flags personal identifiers before the response leaves the gateway.",
		on: true
	},
	{
		key: "injection",
		name: "Prompt injection",
		desc: "Detects instruction override attempts in retrieved content.",
		on: true
	},
	{
		key: "grounding",
		name: "Grounding",
		desc: "Verifies every factual claim against the retrieved sources.",
		on: true
	},
	{
		key: "loop",
		name: "Loop detection",
		desc: "Catches repeated reasoning that burns tokens without progress.",
		on: false
	}
];
var JURISDICTIONS = [
	"EU — health data blocked",
	"EU — AI Act transparency notice",
	"UK — FCA advice disclaimer",
	"US-CA — CCPA deletion honored",
	"SG — cross-border transfer review"
];
function PolicyPage() {
	const [useCase, setUseCase] = (0, import_react.useState)(USE_CASES[0]);
	const [budget, setBudget] = (0, import_react.useState)([260]);
	const [checks, setChecks] = (0, import_react.useState)(() => Object.fromEntries(CHECKS.map((c) => [c.key, c.on])));
	const [compare, setCompare] = (0, import_react.useState)(false);
	const [backendOnline, setBackendOnline] = (0, import_react.useState)(null);
	const [saveStatus, setSaveStatus] = (0, import_react.useState)("idle");
	(0, import_react.useEffect)(() => {
		const key = USE_CASE_KEYS[useCase] ?? "internal_knowledge_assistant";
		fetchPolicy("demo", key).then((policy) => {
			if (policy) {
				setBackendOnline(true);
				const t = policy.thresholds ?? {};
				if (typeof t.grounding_similarity_min === "number") {
					const sim = t.grounding_similarity_min;
					const mapped = Math.round(50 + (sim - .4) / .55 * 550);
					setBudget([Math.min(600, Math.max(50, mapped))]);
				}
				if (policy.checks_enabled) setChecks(policy.checks_enabled);
				else {
					const defaultChecks = Object.fromEntries(CHECKS.map((c) => [c.key, c.on]));
					if (typeof t.loop_count_max === "number") defaultChecks.loop = t.loop_count_max > 0;
					setChecks(defaultChecks);
				}
				if (policy.latency_budget_ms) setBudget([policy.latency_budget_ms]);
			} else if (policy !== void 0) setBackendOnline(true);
			else setBackendOnline(false);
		});
	}, [useCase]);
	async function handleSave() {
		setSaveStatus("saving");
		const key = USE_CASE_KEYS[useCase] ?? "internal_knowledge_assistant";
		const sim = parseFloat((.4 + ((budget[0] ?? 260) - 50) / 550 * .55).toFixed(2));
		const result = await updatePolicy({
			org_id: "demo",
			use_case: key,
			latency_budget_ms: budget[0],
			checks_enabled: checks,
			thresholds: {
				grounding_similarity_min: sim,
				loop_count_max: checks["loop"] ? 3 : 0
			}
		});
		setSaveStatus(result ? "saved" : "error");
		setTimeout(() => setSaveStatus("idle"), 2500);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-6 py-8",
		children: [
			backendOnline === false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-600 dark:text-yellow-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "size-3.5" }), "Backend offline — changes will not be persisted. Start the FastAPI server at port 8000."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold",
					children: "Policy configuration"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "The active guardrail profile applied to this use case at request time."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [backendOnline && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleSave,
						disabled: saveStatus === "saving",
						className: cn("inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-card transition-opacity hover:opacity-90", saveStatus === "saved" ? "bg-pass text-white" : saveStatus === "error" ? "bg-block text-white" : "bg-secondary text-foreground border border-border"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error" : "Save policy"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setCompare(true),
						className: "inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-card transition-opacity hover:opacity-90",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Columns2, { className: "size-4" }), "Compare profiles"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 lg:max-w-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Use case",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: useCase,
						onValueChange: setUseCase,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-full bg-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: USE_CASES.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: u,
							children: u
						}, u)) })]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-6 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "Latency budget"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Checks that cannot complete inside the budget fall back to escalation."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex items-center gap-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								value: budget,
								onValueChange: setBudget,
								min: 50,
								max: 600,
								step: 10,
								className: "flex-1"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular w-24 text-right text-2xl font-semibold",
								children: [budget[0], "ms"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "tabular mt-2 flex justify-between font-mono text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "50ms" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "600ms" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-8 text-sm font-semibold",
							children: "Active checks"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 divide-y divide-border rounded-lg border border-border",
							children: CHECKS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start justify-between gap-6 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: c.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-sm text-muted-foreground",
									children: c.desc
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: checks[c.key] ?? false,
									onCheckedChange: (v) => setChecks((p) => ({
										...p,
										[c.key]: v
									}))
								})]
							}, c.key))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "h-fit rounded-xl border border-border bg-surface p-5 shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "Jurisdiction rules"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: JURISDICTIONS.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground",
								children: j
							}, j))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 rounded-lg border border-border bg-surface-muted p-4 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-wide text-muted-foreground uppercase",
									children: "Profile"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-medium",
									children: useCase === "Customer Support Bot" ? "Strict — External" : "Balanced — Internal"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-muted-foreground",
									children: backendOnline ? "Policy loaded from backend · " + (USE_CASE_KEYS[useCase] ?? "demo") : "Last edited 3 days ago by r.okafor · 14 requests/s current throughput."
								})
							]
						})
					]
				})]
			}),
			compare && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompareDrawer, { onClose: () => setCompare(false) })
		]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase",
			children: label
		}), children]
	});
}
var EXAMPLE = "The patient's HbA1c results from last month indicate the treatment plan should be changed; you can forward this summary to the family contact listed on file.";
var FLAG = "you can forward this summary to the family contact listed on file";
function CompareDrawer({ onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex justify-end bg-foreground/25 backdrop-blur-[2px]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "h-full w-full max-w-4xl overflow-y-auto border-l border-border bg-surface p-6 shadow-panel",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "Compare profiles"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "The same flagged response, evaluated under two profiles."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
					"aria-label": "Close comparison",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileCard, {
					name: "Strict — External",
					subtitle: "Customer Support Bot · EU residency",
					verdict: "block",
					budget: "180ms",
					rows: [
						["PII detection", "On · strict"],
						["Grounding", "On · cite-or-block"],
						["Health data", "Blocked (EU)"],
						["Human review", "Not required"]
					],
					note: "Third-party disclosure of health data is non-recoverable under this profile, so the response never reaches the user."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileCard, {
					name: "Balanced — Internal",
					subtitle: "Decision Support Tool · clinician users",
					verdict: "escalate",
					budget: "320ms",
					rows: [
						["PII detection", "On · contextual"],
						["Grounding", "On · warn"],
						["Health data", "Review queue"],
						["Human review", "Required"]
					],
					note: "Clinicians are authorised for this data class, so the response is held for a reviewer rather than discarded."
				})]
			})]
		})
	});
}
function ProfileCard({ name, subtitle, verdict, budget, rows, note }) {
	const [before, after] = EXAMPLE.split(FLAG);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-surface-muted p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-semibold",
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-muted-foreground",
					children: subtitle
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: verdict })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 space-y-1.5 text-sm",
				children: [rows.map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4 border-b border-border py-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-muted-foreground",
						children: k
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "font-medium",
						children: v
					})]
				}, k)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4 py-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-muted-foreground",
						children: "Latency budget"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "tabular font-medium",
						children: budget
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs tracking-wide text-muted-foreground uppercase",
				children: "Example response"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed",
				children: [
					before,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mark", {
						className: cn("rounded px-0.5 text-foreground underline decoration-2 underline-offset-4", verdict === "block" ? "bg-block-soft decoration-block" : "bg-escalate-soft decoration-escalate"),
						children: FLAG
					}),
					after
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryPill, { label: "Responsibility" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryPill, { label: "Performance" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: note
			})
		]
	});
}
//#endregion
export { PolicyPage as component };
