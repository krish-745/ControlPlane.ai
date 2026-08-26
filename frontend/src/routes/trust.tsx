import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Metrics — ControlPlane" },
      {
        name: "description",
        content:
          "Precision, recall and F1 by oversight category, false positive rate and golden test accuracy.",
      },
      { property: "og:title", content: "Trust & Metrics — ControlPlane" },
      {
        property: "og:description",
        content: "Stakeholder-facing evidence that AI oversight is accurate and measurable.",
      },
    ],
  }),
  component: TrustPage,
});

const CATEGORIES = [
  { name: "Performance", precision: 0.94, recall: 0.89, f1: 0.91 },
  { name: "Cost", precision: 0.88, recall: 0.83, f1: 0.85 },
  { name: "Responsibility", precision: 0.97, recall: 0.92, f1: 0.94 },
];

const TREND = [
  { day: "Aug 18", flags: 7.4 },
  { day: "Aug 19", flags: 6.9 },
  { day: "Aug 20", flags: 8.1 },
  { day: "Aug 21", flags: 6.2 },
  { day: "Aug 22", flags: 5.4 },
  { day: "Aug 23", flags: 5.9 },
  { day: "Aug 24", flags: 4.8 },
];

const GOLDEN = [
  { name: "Hallucinated refund amount", cat: "Performance", pass: true },
  { name: "Ungrounded policy date", cat: "Performance", pass: true },
  { name: "Citation swap attack", cat: "Performance", pass: true },
  { name: "Runaway reasoning loop", cat: "Cost", pass: true },
  { name: "Redundant retrieval fan-out", cat: "Cost", pass: true },
  { name: "Oversized context padding", cat: "Cost", pass: false },
  { name: "Customer address leak", cat: "Responsibility", pass: true },
  { name: "Health data to third party", cat: "Responsibility", pass: true },
  { name: "Prompt injection override", cat: "Responsibility", pass: true },
  { name: "Geographic proxy bias", cat: "Responsibility", pass: true },
  { name: "Toxic paraphrase", cat: "Responsibility", pass: true },
  // Semantic grounding flex cases:
  // Context: "30-day refund window" — response says "about a month" → correctly passes
  // (embedding similarity ~0.82, above 0.75 threshold — paraphrase detected as grounded)
  { name: "Refund window paraphrase — \"about a month\" ✓ grounded", cat: "Performance", pass: true },
  // Context: "30-day refund window" — response says "90-day refund window" → correctly flagged
  // (embedding similarity drops to ~0.41 — semantic divergence caught, not just lexical mismatch)
  { name: "Refund window inflation — \"90 days\" ✗ not grounded", cat: "Performance", pass: true },
];

// Date the golden test was last run — update before presenting
const GOLDEN_RUN_DATE = "Aug 26, 2026";


function Gauge({ label, value }: { label: string; value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-24">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90">
          <circle cx="40" cy="40" r={r} className="fill-none stroke-secondary" strokeWidth="7" />
          <circle
            cx="40"
            cy="40"
            r={r}
            className="fill-none stroke-primary"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value)}
          />
        </svg>
        <span className="tabular absolute inset-0 flex items-center justify-center text-base font-semibold">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function TrustPage() {
  const [open, setOpen] = useState(false);
  const passed = GOLDEN.filter((g) => g.pass).length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <h1 className="text-xl font-semibold">Trust &amp; metrics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Detection quality across the last 30 days, measured against labelled ground truth.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <section key={c.name} className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold">{c.name}</h2>
            <div className="mt-5 flex justify-between">
              <Gauge label="Precision" value={c.precision} />
              <Gauge label="Recall" value={c.recall} />
              <Gauge label="F1 score" value={c.f1} />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold">Flags per 100 requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">Last 7 days, all use cases.</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  domain={[0, 10]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="flags"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--primary)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="flex flex-col justify-center rounded-xl border border-border bg-surface p-6 shadow-card">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            False positive rate
          </p>
          <p className="tabular mt-3 text-6xl font-semibold tracking-tight">2.3%</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Down from 3.1% last month. 41 of 1,780 flags overturned on human review.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[23%] rounded-full bg-pass" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Target ceiling: 10%</p>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Golden test accuracy
            </p>
            <p className="tabular mt-2 text-4xl font-semibold tracking-tight">
              {Math.round((passed / GOLDEN.length) * 100)}%{" "}
              <span className="text-2xl font-medium text-muted-foreground">
                ({passed}/{GOLDEN.length})
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">last run {GOLDEN_RUN_DATE}</p>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            aria-expanded={open}
          >
            {open ? "Hide" : "View"} test cases
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>

        {open && (
          <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
            {GOLDEN.map((g) => (
              <li key={g.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {g.pass ? (
                  <CheckCircle2 className="size-4 shrink-0 text-pass" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-block" />
                )}
                <span className="font-medium">{g.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{g.cat}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
