import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Search, WifiOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { AUDIT_ROWS, ORGANIZATIONS } from "@/lib/controlplane-data";
import { fetchInteractions, type ApiInteraction } from "@/lib/api";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — ControlPlane" },
      {
        name: "description",
        content:
          "Filterable record of every oversight decision: organization, use case, category, action and confidence.",
      },
      { property: "og:title", content: "Audit Log — ControlPlane" },
      {
        property: "og:description",
        content: "A dense, exportable trail of every AI oversight decision.",
      },
    ],
  }),
  component: AuditPage,
});

const CATEGORIES = ["Performance", "Cost", "Responsibility"] as const;

// ── Normalize a live interaction into the shape our table expects ─────────────
type AuditRow = {
  id: string;
  ts: string;
  org: string;
  useCase: string;
  category: string;
  action: string;
  status: "pass" | "patch" | "escalate" | "block";
  confidence: number;
};

function interactionToRow(i: ApiInteraction): AuditRow {
  const d2 = i.stage2_decision ?? i.stage1_decision;
  const status: AuditRow["status"] =
    d2 === "BLOCK" ? "block"
    : d2 === "ESCALATE" ? "escalate"
    : i.stage1_decision === "BLOCK" ? "block"
    : "pass";

  const action =
    status === "block" ? "Blocked"
    : status === "escalate" ? "Escalated to reviewer"
    : "Allowed";

  return {
    id: i.id.slice(0, 12),
    ts: i.created_at.slice(0, 19).replace("T", " "),
    org: "demo",
    useCase: i.use_case,
    category: "Performance",   // the interactions endpoint doesn't expose category; flags do
    action,
    status,
    confidence: 0.9,
  };
}

function AuditPage() {
  const [org, setOrg] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [liveRows, setLiveRows] = useState<AuditRow[] | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Fetch live interactions once on mount
  useEffect(() => {
    fetchInteractions("demo", 100).then((data) => {
      if (data && data.length > 0) {
        setBackendOnline(true);
        setLiveRows(data.map(interactionToRow));
      } else if (data !== undefined) {
        setBackendOnline(true);
        setLiveRows(null); // empty — fall back to static rows
      } else {
        setBackendOnline(false);
        setLiveRows(null);
      }
    });
  }, []);

  // Map static AUDIT_ROWS to the same AuditRow type (they already match)
  const staticRows: AuditRow[] = AUDIT_ROWS.map((r) => ({
    id: r.id,
    ts: r.ts,
    org: r.org,
    useCase: r.useCase,
    category: r.category,
    action: r.action,
    status: r.status,
    confidence: r.confidence,
  }));

  const sourceRows = liveRows ?? staticRows;

  const rows = useMemo(
    () =>
      sourceRows.filter(
        (r) =>
          (org === "all" || r.org === org) &&
          (cat === "all" || r.category === cat) &&
          (q === "" ||
            `${r.id} ${r.useCase} ${r.action}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [sourceRows, org, cat, q],
  );

  function handleExport() {
    const header = "timestamp,id,org,use_case,category,action,confidence";
    const csv = [
      header,
      ...rows.map(
        (r) =>
          `"${r.ts}","${r.id}","${r.org}","${r.useCase}","${r.category}","${r.action}",${r.confidence.toFixed(2)}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "controlplane_audit.csv";
    a.click();
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      {backendOnline === false && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <WifiOff className="size-3.5" />
          Backend offline — showing static demo data. Start the FastAPI server at port 8000 for live audit rows.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Audit log</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {rows.length} of {sourceRows.length} decisions · retained 24 months
            {backendOnline && <span className="ml-2 text-pass">· live</span>}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Download className="size-4" />
          Export CSV
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select value={org} onValueChange={setOrg}>
          <SelectTrigger className="h-9 w-[220px] bg-surface text-sm">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organizations</SelectItem>
            {ORGANIZATIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
            {backendOnline && <SelectItem value="demo">demo (live)</SelectItem>}
          </SelectContent>
        </Select>

        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-9 w-[180px] bg-surface text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search event id, use case, action"
            className="h-9 w-[280px] rounded-md border border-border bg-surface pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead className="sticky top-0">
            <tr className="border-b border-border bg-surface-muted text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2 font-medium">Timestamp</th>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Organization</th>
              <th className="px-3 py-2 font-medium">Use case</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Action taken</th>
              <th className="px-3 py-2 text-right font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/60 last:border-0 hover:bg-secondary/50"
              >
                <td className="tabular px-3 py-1.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
                  {r.ts}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{r.id}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{r.org}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{r.useCase}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{r.category}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <StatusBadge status={r.status} />
                    <span className="text-muted-foreground">{r.action}</span>
                  </div>
                </td>
                <td className="tabular px-3 py-1.5 text-right font-medium">
                  {r.confidence.toFixed(2)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No decisions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
