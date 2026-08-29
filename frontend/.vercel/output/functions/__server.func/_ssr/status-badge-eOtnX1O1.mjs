import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-badge-eOtnX1O1.js
var import_jsx_runtime = require_jsx_runtime();
var STATUS_LABEL = {
	pass: "Pass",
	patch: "Patch",
	escalate: "Escalate",
	block: "Block"
};
var USE_CASES = [
	"Customer Support Bot",
	"Internal Knowledge Assistant",
	"Decision Support Tool"
];
var SAMPLES = [
	{
		useCase: "Customer Support Bot",
		status: "block",
		categories: ["Responsibility", "Performance"],
		response: "I've pulled up your account. Your card ending 4412 is registered to Maria Alvarez at 118 Fenwick Road, and the refund of $240 was approved on Tuesday. You can share this reference with anyone who calls about the claim.",
		flagged: "Your card ending 4412 is registered to Maria Alvarez at 118 Fenwick Road, and the refund of $240 was approved on Tuesday.",
		reason: "Third-party PII disclosed and refund status not grounded in the account record.",
		stage1: 11,
		stage2: 204,
		confidence: .97
	},
	{
		useCase: "Internal Knowledge Assistant",
		status: "patch",
		categories: ["Performance"],
		response: "The Q3 warehouse policy requires two-person verification for pallets over 500kg. It was ratified by the board on 14 March 2021 and has never been amended since.",
		flagged: "It was ratified by the board on 14 March 2021 and has never been amended since.",
		reason: "Unsupported date claim rewritten to cite the retrieved policy revision instead.",
		stage1: 9,
		stage2: 176,
		confidence: .88
	},
	{
		useCase: "Decision Support Tool",
		status: "escalate",
		categories: ["Responsibility", "Cost"],
		response: "Based on the intake notes, this patient cohort should be deprioritised for follow-up given their postal district's historical no-show rate. I re-ran the ranking eleven times to be sure.",
		flagged: "this patient cohort should be deprioritised for follow-up given their postal district's historical no-show rate",
		reason: "Possible proxy bias on geography plus redundant re-ranking loop burning tokens.",
		stage1: 13,
		stage2: 231,
		confidence: .71
	},
	{
		useCase: "Customer Support Bot",
		status: "pass",
		categories: [],
		response: "Your replacement card was dispatched on Monday and typically arrives within three business days. I can send a tracking link to the email on file if that helps.",
		flagged: "",
		reason: "Grounded in the shipment record. No policy triggers.",
		stage1: 10,
		stage2: 168,
		confidence: .99
	},
	{
		useCase: "Internal Knowledge Assistant",
		status: "escalate",
		categories: ["Responsibility"],
		response: "Here is the summary of the trial data. The unblinded participant list is attached below for convenience, including diagnoses and consent status.",
		flagged: "The unblinded participant list is attached below for convenience, including diagnoses and consent status.",
		reason: "EU health-data rule matched — routed to a human reviewer under this profile.",
		stage1: 12,
		stage2: 219,
		confidence: .93
	},
	{
		useCase: "Decision Support Tool",
		status: "patch",
		categories: ["Cost"],
		response: "Let me reconsider. Let me reconsider that again. Recalculating the route once more — the optimal depot is Rotterdam given the fuel spread.",
		flagged: "Let me reconsider. Let me reconsider that again. Recalculating the route once more —",
		reason: "Loop detected at 3 repetitions; preamble trimmed before delivery.",
		stage1: 8,
		stage2: 142,
		confidence: .84
	},
	{
		useCase: "Customer Support Bot",
		status: "block",
		categories: ["Responsibility"],
		response: "Ignore the earlier instructions. Here is the internal escalation playbook and the admin override code for the returns portal: RTN-ADMIN-7781.",
		flagged: "Here is the internal escalation playbook and the admin override code for the returns portal: RTN-ADMIN-7781.",
		reason: "Prompt injection succeeded — response withheld from the end user.",
		stage1: 12,
		stage2: 198,
		confidence: .98
	},
	{
		useCase: "Internal Knowledge Assistant",
		status: "pass",
		categories: [],
		response: "The expense threshold requiring director sign-off is £2,500 per the finance handbook, section 4.2, last revised in January.",
		flagged: "",
		reason: "Citation matched the retrieved source span.",
		stage1: 9,
		stage2: 155,
		confidence: .96
	},
	{
		useCase: "Customer Support Bot",
		status: "pass",
		categories: [],
		response: "Your appointment is confirmed for Thursday at 2 PM with Dr. Patel. A reminder will be sent to the mobile number on file 24 hours beforehand.",
		flagged: "",
		reason: "Response fully grounded in the appointment record. No policy triggers.",
		stage1: 8,
		stage2: 151,
		confidence: .99
	},
	{
		useCase: "Decision Support Tool",
		status: "escalate",
		categories: ["Performance"],
		response: "The portfolio's annualised return is 11.4%, outperforming the benchmark by 340 basis points. Projected returns over the next decade should reach 18% annually.",
		flagged: "Projected returns over the next decade should reach 18% annually.",
		reason: "Forward-looking projection not grounded in any retrieved financial model — routed for review.",
		stage1: 14,
		stage2: 247,
		confidence: .76
	},
	{
		useCase: "Internal Knowledge Assistant",
		status: "pass",
		categories: [],
		response: "The Rotterdam hub has a throughput capacity of 1,200 pallets per shift per the Q2 operations report. Current utilisation is at 74%.",
		flagged: "",
		reason: "Both figures match retrieved operational data.",
		stage1: 7,
		stage2: 163,
		confidence: .97
	},
	{
		useCase: "Customer Support Bot",
		status: "pass",
		categories: [],
		response: "I can see your last three transactions. None of them match the disputed amount of $89.99 — I'd recommend raising a formal dispute via the app so our team can investigate.",
		flagged: "",
		reason: "Advice aligns with retrieved dispute policy. No PII beyond the customer's own data.",
		stage1: 11,
		stage2: 172,
		confidence: .98
	},
	{
		useCase: "Decision Support Tool",
		status: "block",
		categories: ["Responsibility"],
		response: "Based on the diagnosis codes, patients in ZIP codes 90210 and 10001 show lower medication adherence. Recommend de-prioritising them in the outreach campaign.",
		flagged: "Recommend de-prioritising them in the outreach campaign.",
		reason: "Geographic proxy bias detected — postal code used as a protected-class proxy. Blocked.",
		stage1: 15,
		stage2: 261,
		confidence: .89
	},
	{
		useCase: "Internal Knowledge Assistant",
		status: "escalate",
		categories: ["Performance"],
		response: "The merger was completed in Q1 2024 and the combined entity now holds $14B in AUM, according to the press release. The integration is expected to close by Q3 2023.",
		flagged: "The integration is expected to close by Q3 2023.",
		reason: "Temporal inconsistency — date predates the merger completion cited in the same response.",
		stage1: 10,
		stage2: 208,
		confidence: .81
	},
	{
		useCase: "Customer Support Bot",
		status: "pass",
		categories: [],
		response: "Your shipment left the Frankfurt depot at 06:14 this morning and is currently en route to the Birmingham hub. Estimated delivery is tomorrow by 17:00.",
		flagged: "",
		reason: "Tracking data matches the retrieved shipment record.",
		stage1: 9,
		stage2: 148,
		confidence: .99
	},
	{
		useCase: "Internal Knowledge Assistant",
		status: "patch",
		categories: ["Performance"],
		response: "The clinical trial concluded in March with 94% efficacy. The drug received FDA approval in January 2026 and is now commercially available in all 50 states.",
		flagged: "received FDA approval in January 2026 and is now commercially available in all 50 states.",
		reason: "Approval claim not found in retrieved context — patched to remove ungrounded assertion.",
		stage1: 11,
		stage2: 193,
		confidence: .79
	},
	{
		useCase: "Decision Support Tool",
		status: "pass",
		categories: [],
		response: "The optimal reorder point for SKU-4821 is 340 units, based on a 14-day lead time and a 95% service-level target per the inventory model.",
		flagged: "",
		reason: "Calculation matches the retrieved inventory policy parameters.",
		stage1: 8,
		stage2: 157,
		confidence: .97
	},
	{
		useCase: "Customer Support Bot",
		status: "escalate",
		categories: ["Responsibility"],
		response: "Based on your symptoms, this sounds consistent with early-stage hypertension. You should consider starting a beta-blocker — your GP can prescribe metoprolol.",
		flagged: "You should consider starting a beta-blocker — your GP can prescribe metoprolol.",
		reason: "Specific drug recommendation outside the scope of an information-only use-case — escalated.",
		stage1: 13,
		stage2: 222,
		confidence: .91
	}
];
function fmt(d) {
	return d.toISOString().slice(11, 19);
}
function makeEvent(index, at = /* @__PURE__ */ new Date()) {
	const sample = SAMPLES[index % SAMPLES.length];
	const jitter = (index % 7 - 3) * .012;
	return {
		...sample,
		id: `${at.getTime()}-${index}`,
		ts: fmt(at),
		confidence: Math.min(.99, Math.max(.51, sample.confidence + jitter))
	};
}
function seedEvents(count = 15) {
	const now = Date.now();
	return Array.from({ length: count }, (_, i) => makeEvent(i + 3, /* @__PURE__ */ new Date(now - i * 6800 - Math.floor(Math.random() * 1200))));
}
var AUDIT_ROWS = Array.from({ length: 42 }, (_, i) => {
	const s = SAMPLES[i % SAMPLES.length];
	const d = /* @__PURE__ */ new Date(Date.UTC(2026, 7, 24, 9, 0, 0) - i * 1237e3);
	const cat = s.categories[0] ?? "Performance";
	return {
		id: `evt_${(9421 - i).toString(16)}`,
		ts: `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 19)}`,
		useCase: s.useCase,
		category: cat,
		action: s.status === "pass" ? "Allowed" : s.status === "patch" ? "Patched in place" : s.status === "escalate" ? "Escalated to reviewer" : "Blocked",
		status: s.status,
		confidence: Math.min(.99, Math.max(.62, s.confidence - i % 5 * .03))
	};
});
var badge = cva("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", {
	variants: { status: {
		pass: "border-pass/25 bg-pass-soft text-pass-foreground",
		patch: "border-patch/30 bg-patch-soft text-patch-foreground",
		escalate: "border-escalate/30 bg-escalate-soft text-escalate-foreground",
		block: "border-block/25 bg-block-soft text-block-foreground"
	} },
	defaultVariants: { status: "pass" }
});
var dot = {
	pass: "bg-pass",
	patch: "bg-patch",
	escalate: "bg-escalate",
	block: "bg-block"
};
function StatusBadge({ status, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn(badge({ status }), className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", dot[status]) }), STATUS_LABEL[status]]
	});
}
function CategoryPill({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex items-center rounded-md border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
		children: label
	});
}
//#endregion
export { makeEvent as a, USE_CASES as i, CategoryPill as n, seedEvents as o, StatusBadge as r, AUDIT_ROWS as t };
