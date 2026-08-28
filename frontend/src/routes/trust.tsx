import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { fetchTrustMetrics, type TrustMetrics } from "@/lib/api";

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

// Data is now loaded dynamically from the backend
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
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);

  useEffect(() => {
    fetchTrustMetrics().then((res) => {
      if (res) setMetrics(res);
    });
  }, []);

  if (!metrics) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <h1 className="text-xl font-semibold">Trust &amp; metrics</h1>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading live metrics...</p>
      </div>
    );
  }

  const { fpr, total_flags, escalated, trend, categories, golden } = metrics;
  const passed = golden.passed;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <h1 className="text-xl font-semibold">Trust &amp; metrics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Detection quality across the last 30 days, measured against labelled ground truth.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {categories.map((c) => (
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
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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
          <p className="tabular mt-3 text-6xl font-semibold tracking-tight">{fpr}%</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Calculated from {escalated} escalated interactions requiring human review.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-pass"
              style={{ width: `${Math.min(100, Math.max(0, fpr * 10))}%` }}
            />
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
              {Math.round((passed / golden.total) * 100)}%{" "}
              <span className="text-2xl font-medium text-muted-foreground">
                ({passed}/{golden.total})
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">last run {golden.date}</p>
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
            {golden.results.map((g) => (
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
