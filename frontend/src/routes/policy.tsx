import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Columns2, Save, WifiOff, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, CategoryPill } from "@/components/status-badge";
import { ORGANIZATIONS, USE_CASES } from "@/lib/controlplane-data";
import { cn } from "@/lib/utils";
import { fetchPolicy, updatePolicy } from "@/lib/api";

export const Route = createFileRoute("/policy")({
  head: () => ({
    meta: [
      { title: "Policy Configuration — ControlPlane" },
      {
        name: "description",
        content:
          "Tune latency budgets, active checks and jurisdiction rules per organization and use case.",
      },
      { property: "og:title", content: "Policy Configuration — ControlPlane" },
      {
        property: "og:description",
        content: "Readable, auditable AI guardrail policies — no JSON required.",
      },
    ],
  }),
  component: PolicyPage,
});

// Use-case keys that match the backend seed profiles
const USE_CASE_KEYS: Record<string, string> = {
  "Customer Support Bot": "customer_support_bot",
  "Internal Knowledge Assistant": "internal_knowledge_assistant",
  "Decision Support Tool": "decision_support_batch",
};

const CHECKS = [
  {
    key: "pii",
    name: "PII detection",
    desc: "Flags personal identifiers before the response leaves the gateway.",
    on: true,
  },
  {
    key: "injection",
    name: "Prompt injection",
    desc: "Detects instruction override attempts in retrieved content.",
    on: true,
  },
  {
    key: "grounding",
    name: "Grounding",
    desc: "Verifies every factual claim against the retrieved sources.",
    on: true,
  },
  {
    key: "loop",
    name: "Loop detection",
    desc: "Catches repeated reasoning that burns tokens without progress.",
    on: false,
  },
];

const JURISDICTIONS = [
  "EU — health data blocked",
  "EU — AI Act transparency notice",
  "UK — FCA advice disclaimer",
  "US-CA — CCPA deletion honored",
  "SG — cross-border transfer review",
];

function PolicyPage() {
  const [org, setOrg] = useState<string>(ORGANIZATIONS[0]);
  const [useCase, setUseCase] = useState<string>(USE_CASES[0]);
  const [budget, setBudget] = useState([260]);
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(CHECKS.map((c) => [c.key, c.on])),
  );
  const [compare, setCompare] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Load policy from backend when org/use-case changes
  useEffect(() => {
    const key = USE_CASE_KEYS[useCase] ?? "internal_knowledge_assistant";
    fetchPolicy("demo", key).then((policy) => {
      if (policy) {
        setBackendOnline(true);
        const t = policy.thresholds ?? {};
        // Map grounding_similarity_min → latency budget (rough proxy for demo)
        if (typeof t.grounding_similarity_min === "number") {
          // budget range 50–600ms; similarity 0.4–0.95 → map linearly
          const sim = t.grounding_similarity_min as number;
          const mapped = Math.round(50 + ((sim - 0.4) / 0.55) * 550);
          setBudget([Math.min(600, Math.max(50, mapped))]);
        }
        if (typeof t.loop_count_max === "number") {
          setChecks((prev) => ({ ...prev, loop: (t.loop_count_max as number) > 0 }));
        }
      } else if (policy !== undefined) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    });
  }, [org, useCase]);

  async function handleSave() {
    setSaveStatus("saving");
    const key = USE_CASE_KEYS[useCase] ?? "internal_knowledge_assistant";
    // Map budget back to similarity threshold
    const sim = parseFloat((0.4 + (((budget[0] ?? 260) - 50) / 550) * 0.55).toFixed(2));
    const result = await updatePolicy("demo", key, {
      grounding_similarity_min: sim,
      loop_count_max: checks["loop"] ? 3 : 0,
    });
    setSaveStatus(result ? "saved" : "error");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      {backendOnline === false && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <WifiOff className="size-3.5" />
          Backend offline — changes will not be persisted. Start the FastAPI server at port 8000.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Policy configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The active guardrail profile applied to this use case at request time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {backendOnline && (
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-card transition-opacity hover:opacity-90",
                saveStatus === "saved"
                  ? "bg-pass text-white"
                  : saveStatus === "error"
                    ? "bg-block text-white"
                    : "bg-secondary text-foreground border border-border",
              )}
            >
              <Save className="size-4" />
              {saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "saved"
                  ? "Saved!"
                  : saveStatus === "error"
                    ? "Error"
                    : "Save policy"}
            </button>
          )}
          <button
            onClick={() => setCompare(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-card transition-opacity hover:opacity-90"
          >
            <Columns2 className="size-4" />
            Compare profiles
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="Organization">
          <Select value={org} onValueChange={setOrg}>
            <SelectTrigger className="w-full bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORGANIZATIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Use case">
          <Select value={useCase} onValueChange={setUseCase}>
            <SelectTrigger className="w-full bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USE_CASES.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold">Latency budget</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Checks that cannot complete inside the budget fall back to escalation.
          </p>
          <div className="mt-6 flex items-center gap-5">
            <Slider
              value={budget}
              onValueChange={setBudget}
              min={50}
              max={600}
              step={10}
              className="flex-1"
            />
            <span className="tabular w-24 text-right text-2xl font-semibold">{budget[0]}ms</span>
          </div>
          <div className="tabular mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>50ms</span>
            <span>600ms</span>
          </div>

          <h2 className="mt-8 text-sm font-semibold">Active checks</h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {CHECKS.map((c) => (
              <li key={c.key} className="flex items-start justify-between gap-6 p-4">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.desc}</p>
                </div>
                <Switch
                  checked={checks[c.key] ?? false}
                  onCheckedChange={(v) => setChecks((p) => ({ ...p, [c.key]: v }))}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="h-fit rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold">Jurisdiction rules</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inherited from the organization's residency settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {JURISDICTIONS.map((j) => (
              <span
                key={j}
                className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {j}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-border bg-surface-muted p-4 text-sm">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Profile</p>
            <p className="mt-1 font-medium">
              {useCase === "Customer Support Bot" ? "Strict — External" : "Balanced — Internal"}
            </p>
            <p className="mt-2 text-muted-foreground">
              {backendOnline
                ? "Policy loaded from backend · " + (USE_CASE_KEYS[useCase] ?? "demo")
                : "Last edited 3 days ago by r.okafor · 14 requests/s current throughput."}
            </p>
          </div>
        </section>
      </div>

      {compare && <CompareDrawer onClose={() => setCompare(false)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const EXAMPLE =
  "The patient's HbA1c results from last month indicate the treatment plan should be changed; you can forward this summary to the family contact listed on file.";
const FLAG = "you can forward this summary to the family contact listed on file";

function CompareDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/25 backdrop-blur-[2px]">
      <div className="h-full w-full max-w-4xl overflow-y-auto border-l border-border bg-surface p-6 shadow-panel">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Compare profiles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The same flagged response, evaluated under two profiles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close comparison"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProfileCard
            name="Strict — External"
            subtitle="Customer Support Bot · EU residency"
            verdict="block"
            budget="180ms"
            rows={[
              ["PII detection", "On · strict"],
              ["Grounding", "On · cite-or-block"],
              ["Health data", "Blocked (EU)"],
              ["Human review", "Not required"],
            ]}
            note="Third-party disclosure of health data is non-recoverable under this profile, so the response never reaches the user."
          />
          <ProfileCard
            name="Balanced — Internal"
            subtitle="Decision Support Tool · clinician users"
            verdict="escalate"
            budget="320ms"
            rows={[
              ["PII detection", "On · contextual"],
              ["Grounding", "On · warn"],
              ["Health data", "Review queue"],
              ["Human review", "Required"],
            ]}
            note="Clinicians are authorised for this data class, so the response is held for a reviewer rather than discarded."
          />
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  name,
  subtitle,
  verdict,
  budget,
  rows,
  note,
}: {
  name: string;
  subtitle: string;
  verdict: "block" | "escalate";
  budget: string;
  rows: [string, string][];
  note: string;
}) {
  const [before, after] = EXAMPLE.split(FLAG) as [string, string];
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <StatusBadge status={verdict} />
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-border py-1.5">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-muted-foreground">Latency budget</dt>
          <dd className="tabular font-medium">{budget}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">Example response</p>
      <p className="mt-2 rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed">
        {before}
        <mark
          className={cn(
            "rounded px-0.5 text-foreground underline decoration-2 underline-offset-4",
            verdict === "block"
              ? "bg-block-soft decoration-block"
              : "bg-escalate-soft decoration-escalate",
          )}
        >
          {FLAG}
        </mark>
        {after}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <CategoryPill label="Responsibility" />
        <CategoryPill label="Performance" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
