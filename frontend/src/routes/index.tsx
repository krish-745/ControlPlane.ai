import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X, Zap, ChevronRight, WifiOff, Info } from "lucide-react";
import { StatusBadge, CategoryPill } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { makeEvent, seedEvents, type MonitorEvent, type Status } from "@/lib/controlplane-data";
import { fetchFlags, fetchInteractions, type ApiFlag, type ApiInteraction } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ControlPlane.ai" },
      {
        name: "description",
        content:
          "Live feed of AI responses checked for grounding, cost and safety before they reach your users.",
      },
      { property: "og:title", content: "Monitor — ControlPlane AI Oversight" },
      {
        property: "og:description",
        content: "Real-time inspection of every AI response passing through your applications.",
      },
    ],
  }),
  component: MonitorPage,
});


const HIGHLIGHT: Record<Status, string> = {
  pass: "bg-pass-soft decoration-pass",
  patch: "bg-patch-soft decoration-patch",
  escalate: "bg-escalate-soft decoration-escalate",
  block: "bg-block-soft decoration-block",
};

// ── Format use case string to be human readable (snake_case -> Title Case) ──
function formatUseCase(uc: string): string {
  return uc
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Build a lookup map from interaction_id → measured latencies ───────────────
function buildLatencyMap(
  interactions: ApiInteraction[],
): Map<string, { stage1: number; stage2: number; use_case?: string }> {
  const map = new Map<string, { stage1: number; stage2: number; use_case?: string }>();
  for (const ix of interactions) {
    map.set(ix.id, {
      stage1: ix.stage1_latency_ms ?? 0,
      stage2: ix.stage2_latency_ms ?? 0,
      use_case: ix.use_case,
    });
  }
  return map;
}

// ── Compute rolling average latency from the most recent N interactions ───────
function avgLatency(
  interactions: ApiInteraction[],
  n = 20,
): { stage1: number; stage2: number } {
  const recent = interactions.slice(0, n);
  if (recent.length === 0) return { stage1: 0, stage2: 0 };
  const s1 = recent.filter((ix) => ix.stage1_latency_ms != null);
  const s2 = recent.filter((ix) => ix.stage2_latency_ms != null);
  return {
    stage1:
      s1.length > 0
        ? s1.reduce((a, ix) => a + (ix.stage1_latency_ms ?? 0), 0) / s1.length
        : 0,
    stage2:
      s2.length > 0
        ? s2.reduce((a, ix) => a + (ix.stage2_latency_ms ?? 0), 0) / s2.length
        : 0,
  };
}

// ── Map an API flag to the MonitorEvent shape ─────────────────────────────────
function flagsToEvent(
  flags: ApiFlag[],
  latencyMap: Map<string, { stage1: number; stage2: number; use_case?: string }>,
): MonitorEvent {
  const f = flags[0]!;

  const actions = flags.map(fl => fl.action_taken.toLowerCase());
  const status: Status =
    actions.includes("block") ? "block"
      : actions.includes("escalate") ? "escalate"
        : actions.includes("allow") ? "pass"
          : "patch";

  const catSet = new Set<"Performance" | "Cost" | "Responsibility">();
  for (const fl of flags) {
    for (const c of fl.categories) {
      const lc = c.toLowerCase();
      if (lc === "performance") catSet.add("Performance");
      if (lc === "cost") catSet.add("Cost");
      if (lc === "responsibility") catSet.add("Responsibility");
    }
  }
  const categories = Array.from(catSet);

  const ts = f.created_at
    ? new Date(f.created_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" })
    : "--:--:--";

  const interaction = latencyMap.get(f.interaction_id);
  const latency = interaction ?? { stage1: 0, stage2: 0 };

  const reason = flags.length > 1
    ? "Multiple violations:\n" + flags.map((fl) => `• ${fl.reason}`).join("\n")
    : f.reason;

  const combinedSpans = flags.map(fl => fl.span).filter(Boolean).join(" ... ");
  const confidence = Math.max(...flags.map(fl => fl.confidence ?? 0));

  return {
    id: f.interaction_id,
    ts,
    useCase: interaction?.use_case ?? f.interaction_id,
    org: "live",
    status,
    categories,
    response: combinedSpans || "(no span recorded)",
    flagged: combinedSpans,
    reason,
    stage1: latency.stage1,
    stage2: latency.stage2,
    confidence,
  };
}

function LatencyStrip({ stage1, stage2 }: { stage1: number; stage2: number }) {
  const s1Display = stage1 > 0 ? (stage1 < 1 ? "<1ms" : `${Math.round(stage1)}ms`) : "—";
  const s2Display = stage2 > 0 ? (stage2 < 1 ? "<1ms" : `${Math.round(stage2)}ms`) : "—";
  const isLive = stage1 > 0 || stage2 > 0;

  return (
    <div className="border-b border-border bg-surface-muted">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
          <Zap className="size-3.5 text-primary" />
          Inline inspection
        </span>
        <span className="text-muted-foreground">
          Stage 1 checks:{" "}
          <span className={cn("tabular font-semibold", isLive ? "text-foreground" : "text-muted-foreground")}>
            {s1Display}
          </span>
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="text-muted-foreground">
          Stage 2 checks:{" "}
          <span className={cn("tabular font-semibold", isLive ? "text-foreground" : "text-muted-foreground")}>
            {s2Display}
          </span>
        </span>
        <span className="ml-auto text-muted-foreground">
          {isLive ? "Rolling Average · Last 20 Requests" : "p99 budget 400ms"}
        </span>
      </div>
    </div>
  );
}

function MonitorPage() {
  const [events, setEvents] = useState<MonitorEvent[]>(() => seedEvents());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [avgLatencies, setAvgLatencies] = useState({ stage1: 0, stage2: 0 });

  // Poll live flags + interactions from the backend every 3.8 s
  useEffect(() => {
    let mockCounter = 0;

    async function poll() {
      // Fetch both endpoints in parallel
      const [liveFlags, liveInteractions] = await Promise.all([
        fetchFlags("demo", 40),
        fetchInteractions("demo", 40),
      ]);

      if (liveFlags && liveFlags.length > 0) {
        setBackendOnline(true);

        // Build interaction latency lookup
        const latencyMap = buildLatencyMap(liveInteractions ?? []);

        // Group flags by interaction_id
        const flagsByIx = new Map<string, ApiFlag[]>();
        for (const f of liveFlags) {
          const group = flagsByIx.get(f.interaction_id) ?? [];
          group.push(f);
          flagsByIx.set(f.interaction_id, group);
        }

        // Map grouped flags → events with real latency data
        const liveEvents = Array.from(flagsByIx.values()).map((group) =>
          flagsToEvent(group, latencyMap)
        );
        setEvents(liveEvents);

        // Update rolling average latency display
        if (liveInteractions && liveInteractions.length > 0) {
          setAvgLatencies(avgLatency(liveInteractions));
        }
      } else if (liveFlags !== undefined) {
        // Backend responded but no flags yet — still online, show demo data
        setBackendOnline(true);
        mockCounter += 1;
        const at = new Date(Date.now() - Math.floor(Math.random() * 800));
        setEvents((prev) => [makeEvent(mockCounter, at), ...prev].slice(0, 15));
      } else {
        // Fetch returned undefined — backend offline
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

  const shown = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.status === filter)),
    [events, filter],
  );
  const selected = events.find((e) => e.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const c: Record<Status, number> = { pass: 0, patch: 0, escalate: 0, block: 0 };
    for (const e of events) c[e.status] += 1;
    return c;
  }, [events]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <LatencyStrip stage1={avgLatencies.stage1} stage2={avgLatencies.stage2} />

      {backendOnline === false && (
        <div className="flex items-center gap-2 border-b border-yellow-500/30 bg-yellow-500/10 px-6 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <WifiOff className="size-3.5" />
          Backend offline — showing demo data. Start the FastAPI server at port 8000 to see live events.
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-6 py-6">
        <div className={cn("min-w-0 flex-1", selected && "hidden xl:block")}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">Live monitor</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {backendOnline
                  ? "Showing live flags from the backend. Select a row to review the verdict."
                  : "Every model response inspected in flight. Select a row to review the verdict."}
              </p>
            </div>
            <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
              {(["all", "pass", "patch", "escalate", "block"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    filter === f
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                  {f !== "all" && (
                    <span className="tabular ml-1.5 text-muted-foreground">{counts[f]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      Use case
                      <span title="The specific AI application or policy profile governing this request." className="flex">
                        <Info className="size-3.5 text-muted-foreground/70 cursor-help" />
                      </span>
                    </div>
                  </th>
                  <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Flags</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Confidence</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={cn(
                      "cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/60",
                      selectedId === e.id && "bg-accent/60",
                    )}
                  >
                    <td className="tabular px-4 py-3 font-mono text-xs text-muted-foreground">
                      {e.ts}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatUseCase(e.useCase)}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {e.categories.length ? (
                          e.categories.map((c) => <CategoryPill key={c} label={c} />)
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="tabular px-4 py-3 text-muted-foreground">
                      {e.confidence.toFixed(2)}
                    </td>
                    <td className="px-2 text-muted-foreground">
                      <ChevronRight className="size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && <DetailPanel event={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  );
}

function DetailPanel({ event, onClose }: { event: MonitorEvent; onClose: () => void }) {
  const parts = event.flagged ? event.response.split(event.flagged) : [event.response];

  return (
    <aside className="w-full shrink-0 xl:w-[420px]">
      <div className="sticky top-20 rounded-xl border border-border bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Response review</p>
            <h2 className="mt-1 text-base font-semibold">{formatUseCase(event.useCase)}</h2>
            <p className="tabular mt-0.5 font-mono text-xs text-muted-foreground">
              {event.org} · {event.ts}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={event.status} />
          {event.categories.map((c) => (
            <CategoryPill key={c} label={c} />
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface-muted p-4 text-sm leading-relaxed">
          {parts.map((p, i) => (
            <span key={i}>
              {p}
              {i < parts.length - 1 && (
                <mark
                  className={cn(
                    "rounded px-0.5 text-foreground underline decoration-2 underline-offset-4",
                    HIGHLIGHT[event.status],
                  )}
                >
                  {event.flagged}
                </mark>
              )}
            </span>
          ))}
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Why</dt>
            <dd className="mt-1 text-muted-foreground">{event.reason}</dd>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
            <Metric
              label="Stage 1"
              value={event.stage1 > 0 ? (event.stage1 < 1 ? "<1ms" : `${Math.round(event.stage1)}ms`) : "—"}
              live={event.stage1 > 0}
            />
            <Metric
              label="Stage 2"
              value={event.stage2 > 0 ? (event.stage2 < 1 ? "<1ms" : `${Math.round(event.stage2)}ms`) : "—"}
              live={event.stage2 > 0}
            />
            <Metric label="Confidence" value={event.confidence.toFixed(2)} />
          </div>
        </dl>
      </div>
    </aside>
  );
}

function Metric({ label, value, live = false }: { label: string; value: string; live?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-0.5 text-sm font-semibold", live && "text-primary")}>{value}</p>
    </div>
  );
}
